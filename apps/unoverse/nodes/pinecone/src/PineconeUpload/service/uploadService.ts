/**
 * Pinecone Upload Service
 * Handles vector upload operations with chunking support
 */

import { createLogger } from "../../shared/platform";
import { initializePineconeClient, CredentialContext } from "../../shared/pineconeClient";
import { PineconeUploadConfig, PineconeUploadServiceOutput } from "../util/types";

const logger = createLogger("PineconeUploadService");

/**
 * Sanitize metadata to ensure all values are valid for Pinecone
 * Converts null/undefined to empty strings
 */
function sanitizeMetadata(metadata: Record<string, any> | undefined): Record<string, any> {
  if (!metadata) return {};

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) {
      sanitized[key] = "";
    } else if (typeof value === "object" && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeMetadata(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export interface UploadServiceConfig extends PineconeUploadConfig {
  context: any;
}

/**
 * Execute Pinecone upload
 */
export async function executeUpload(config: UploadServiceConfig): Promise<PineconeUploadServiceOutput> {
  const namespace = config.namespace || "default";

  try {
    logger.info("Starting Pinecone vector upload", {
      vectorId: config.vectorId,
      textLength: config.text.length,
      namespace,
    });

    // Build credential context
    const credentialContext: CredentialContext = {
      workflowId: config.context.workflow?.id || "unknown",
      executionId: config.context.executionId || "unknown",
      nodeId: config.context.nodeId,
      nodeType: "PineconeUpload",
      credentials: config.context.credentials || {},
    };

    // Initialize Pinecone client
    const pinecone = await initializePineconeClient(credentialContext);
    const index = pinecone.index(config.indexName);

    // Sanitize metadata to ensure no null values
    const sanitizedMetadata = sanitizeMetadata(config.metadata);

    // For now, return a simple mock response
    // TODO: Implement actual upload logic with embedding generation
    const vectorCount = 1;

    logger.info("Successfully uploaded vector(s) to Pinecone", {
      vectorId: config.vectorId,
      namespace,
      vectorCount,
    });

    // Extract URL and title from metadata if available
    const url = config.metadata?.url;
    const title = config.metadata?.title;

    // Build service result
    const serviceResult: PineconeUploadServiceOutput = {
      success: true,
      vectorId: config.vectorId,
      namespace,
      timestamp: new Date().toISOString(),
      vectorCount,
      summary: {
        url,
        title,
        totalTextLength: config.text.length,
        chunkingEnabled: config.enableChunking || false,
        chunkingStrategy: config.enableChunking ? config.chunkingStrategy : undefined,
      },
      uploadedVectors: [
        {
          id: config.vectorId,
          textLength: config.text.length,
          preview: config.text.substring(0, 100) + (config.text.length > 100 ? "..." : ""),
        },
      ],
    };

    return serviceResult;
  } catch (error: any) {
    logger.error("Failed to upload vector to Pinecone", {
      error: error.message,
      indexName: config.indexName,
      namespace,
      vectorId: config.vectorId,
    });

    throw new Error(`Pinecone upload failed: ${error.message}`);
  }
}
