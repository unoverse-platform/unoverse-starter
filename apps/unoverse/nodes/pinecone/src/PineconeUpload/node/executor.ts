/**
 * PineconeUpload node executor
 * Uploads a single vector to Pinecone
 */

import { getPlatformDependencies, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { PineconeUploadConfig, PineconeUploadOutput } from "../util/types";
import { executeUpload } from "../service/uploadService";

// Get platform dependencies - CRITICAL: Use Pattern A to avoid instanceof errors
const { PromiseNode, createLogger } = getPlatformDependencies();

const NODE_TYPE = "PineconeUpload";

export default class PineconeUploadExecutor extends PromiseNode<PineconeUploadConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: PineconeUploadConfig,
    context: NodeExecutionContext
  ): Promise<PineconeUploadOutput> {
    const logger = createLogger("PineconeUpload");

    // Validate index name
    if (!config.indexName || config.indexName.trim() === "") {
      throw new Error("Index name is required");
    }

    // Validate vector ID
    if (!config.vectorId || config.vectorId.trim() === "") {
      throw new Error("Vector ID is required");
    }

    // Validate text
    if (!config.text || config.text.trim() === "") {
      throw new Error("Text is required for embedding generation");
    }

    // Execute upload using service
    const result = await executeUpload({
      ...config,
      context,
    });

    // Return wrapped in __outputs
    return {
      __outputs: {
        output: result,
      },
    };
  }
}
