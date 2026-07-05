/**
 * DynamoDB client management with caching
 */
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { AWSCredentials } from "./types";

// Client cache to avoid recreating clients for the same credentials
const clientCache = new Map<string, { client: DynamoDBDocumentClient; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get cache key for credentials
 */
function getCacheKey(credentials: AWSCredentials): string {
  return `${credentials.accessKeyId}_${credentials.region}`;
}

/**
 * Initialize AWS DynamoDB client with credentials (with caching)
 */
export function initializeDynamoDBClient(credentials: AWSCredentials, logger: any): DynamoDBDocumentClient {
  const cacheKey = getCacheKey(credentials);
  const now = Date.now();
  
  // Check cache first
  const cached = clientCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    logger.debug('Using cached DynamoDB client', { cacheKey });
    return cached.client;
  }
  
  if (!credentials.accessKeyId || !credentials.secretAccessKey) {
    throw new Error('AWS credentials missing accessKeyId or secretAccessKey');
  }
  
  const region = credentials.region || 'us-east-1';
  
  const dynamoClient = new DynamoDBClient({
    region,
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });

  // Create document client for easier operations
  const client = DynamoDBDocumentClient.from(dynamoClient);
  
  // Cache the client
  clientCache.set(cacheKey, { client, timestamp: now });
  logger.debug('Created and cached new DynamoDB client', { cacheKey, region });
  
  return client;
}

/**
 * Clean up expired clients from cache
 */
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of clientCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      clientCache.delete(key);
    }
  }
}

// Run cleanup every minute
setInterval(cleanupCache, 60 * 1000);
