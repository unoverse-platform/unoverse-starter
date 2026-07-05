/**
 * Pinecone Query Node Executor
 * Handles the execution of vector similarity search in Pinecone with optional reranking
 */

import { getPlatformDependencies, type NodeExecutionContext } from "@unoverse-platform/plugin-base";
import { PineconeQueryConfig, PineconeQueryOutput } from "../util/types";
import { executeQuery } from "../service/queryService";

// Get platform dependencies - CRITICAL: Use Pattern A to avoid instanceof errors
const { PromiseNode, createLogger } = getPlatformDependencies();

const NODE_TYPE = "PineconeQuery";

export default class PineconeQueryExecutor extends PromiseNode<PineconeQueryConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: PineconeQueryConfig,
    context: NodeExecutionContext
  ): Promise<PineconeQueryOutput> {
    const logger = createLogger("PineconeQuery");

    // Validate configuration
    if (!config.indexName) {
      throw new Error("Index name is required");
    }
    if (!config.query) {
      throw new Error("Query text is required");
    }

    // Execute query using service
    const result = await executeQuery({
      ...config,
      context,
    });

    // Return data wrapped in __outputs pattern
    return {
      __outputs: {
        output: result.results || [],
        topResult: result.topResult || undefined,
      },
    };
  }
}
