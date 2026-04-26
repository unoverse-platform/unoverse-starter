/**
 * Bedrock client factory for Nova Speech
 */

import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";
import { NodeHttp2Handler } from "@smithy/node-http-handler";

export interface BedrockClientConfig {
  region?: string;
  requestTimeout?: number;
  sessionTimeout?: number;
  disableConcurrentStreams?: boolean;
  maxConcurrentStreams?: number;
}

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

/**
 * Cache of Bedrock clients keyed by (accessKeyId + region + config signature).
 *
 * Creating a `BedrockRuntimeClient` with an `NodeHttp2Handler` incurs noticeable
 * latency (~100–300ms on first call due to handler init + TLS warmup). Since the
 * same credentials and config are used for every voice session in a typical
 * deployment, we cache aggressively.
 *
 * Bounded to MAX_CACHE_SIZE entries to prevent leaks if credentials rotate.
 */
const MAX_CACHE_SIZE = 8;
const clientCache = new Map<string, BedrockRuntimeClient>();

function buildCacheKey(credentials: AWSCredentials, config: Required<BedrockClientConfig>): string {
  // accessKeyId + sessionToken make a unique credential; region + timeouts make
  // a unique client. Session token is included so short-lived STS creds get
  // their own entry and don't serve stale keys after rotation.
  return [
    credentials.accessKeyId,
    credentials.sessionToken ?? "",
    config.region,
    config.requestTimeout,
    config.sessionTimeout,
    config.disableConcurrentStreams ? 1 : 0,
    config.maxConcurrentStreams,
  ].join("|");
}

/**
 * Factory for creating configured Bedrock clients
 */
export class BedrockClientFactory {
  /**
   * Creates (or returns cached) Bedrock client with explicit configuration.
   * Cache is keyed by credential + region + config; identical callers reuse
   * the same underlying HTTP/2 connection pool.
   */
  static create(credentials: AWSCredentials, config: Required<BedrockClientConfig>): BedrockRuntimeClient {
    const key = buildCacheKey(credentials, config);
    const cached = clientCache.get(key);
    if (cached) {
      // Move to end (LRU touch)
      clientCache.delete(key);
      clientCache.set(key, cached);
      return cached;
    }

    // Evict oldest if at capacity
    if (clientCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = clientCache.keys().next().value;
      if (oldestKey !== undefined) {
        const evicted = clientCache.get(oldestKey);
        clientCache.delete(oldestKey);
        // Best-effort cleanup; SDK client has no explicit dispose, but the
        // underlying handler will be GC'd when no references remain.
        evicted?.destroy?.();
      }
    }

    // Create HTTP/2 handler with explicit configuration
    const http2Handler = new NodeHttp2Handler({
      requestTimeout: config.requestTimeout,
      sessionTimeout: config.sessionTimeout,
      disableConcurrentStreams: config.disableConcurrentStreams,
      maxConcurrentStreams: config.maxConcurrentStreams,
    });

    const client = new BedrockRuntimeClient({
      region: config.region,
      credentials,
      requestHandler: http2Handler,
    });

    clientCache.set(key, client);
    return client;
  }

  /**
   * Clear the client cache. Exposed for tests and credential-rotation hooks.
   */
  static clearCache(): void {
    for (const client of clientCache.values()) {
      client.destroy?.();
    }
    clientCache.clear();
  }

  /**
   * Nova Speech optimized configuration - explicit and clear
   */
  static readonly NOVA_SPEECH_CONFIG: Required<BedrockClientConfig> = {
    region: "us-east-1",
    requestTimeout: 300000, // 5 minutes
    sessionTimeout: 300000, // 5 minutes
    disableConcurrentStreams: true,
    maxConcurrentStreams: 5,
  };
}
