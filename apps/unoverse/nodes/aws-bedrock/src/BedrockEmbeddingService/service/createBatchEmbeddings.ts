/**
 * BedrockEmbeddingService batch service methods
 * These methods are exposed to other nodes via service calls
 */

import { type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { generateBatchEmbeddings } from "../../BedrockEmbedding/service/embeddings";
import {
  validateEmbeddingText,
  validateBedrockConfig as validateModelConfig,
} from "../../BedrockEmbedding/util/validation";

/**
 * Service method: Create batch embeddings
 * Processes multiple texts efficiently using a cached Bedrock client
 */
export const createBatchEmbeddings = async (params: any, config: any, context: NodeExecutionContext) => {
  const logger = context.api?.createLogger?.("BedrockEmbeddingService") || console;

  const { texts } = params;

  // Validate input
  if (!Array.isArray(texts)) {
    throw new Error("texts must be an array");
  }

  if (texts.length === 0) {
    throw new Error("texts array cannot be empty");
  }

  // Validate each text
  const validTexts: string[] = [];
  for (let i = 0; i < texts.length; i++) {
    const processedText = texts[i]?.trim() || "";

    const textValidation = validateEmbeddingText(processedText);
    if (!textValidation.success) {
      throw new Error(`Text at index ${i}: ${textValidation.error}`);
    }
    validTexts.push(processedText);
  }

  // Validate config
  const bedrockConfig = {
    model: config.model,
    dimensions: config.dimensions ? parseInt(config.dimensions, 10) : undefined,
    normalize: config.normalize,
  };

  const configValidation = validateModelConfig(bedrockConfig);
  if (!configValidation.success) {
    throw new Error(configValidation.error);
  }

  logger.info(`Creating batch embeddings for ${validTexts.length} texts`, {
    model: bedrockConfig.model,
    dimensions: bedrockConfig.dimensions,
  });

  // Build credential context
  const credentialContext = buildCredentialContext(context, "BedrockEmbeddingService");

  // Generate embeddings using shared service with credential context and api
  // This will use the cached client for the same execution context
  const embeddings = await generateBatchEmbeddings(validTexts, bedrockConfig, credentialContext, context.api);

  logger.info(`Successfully generated ${embeddings.length} embeddings`);

  return {
    embeddings,
    dimensions: embeddings[0]?.length || 0,
    model: bedrockConfig.model,
    count: embeddings.length,
  };
};

/**
 * Build credential context from execution context
 */
function buildCredentialContext(context: NodeExecutionContext, nodeType: string) {
  return {
    workflowId: context.workflowId,
    executionId: context.executionId,
    nodeId: context.nodeId,
    nodeType: nodeType,
    config: context.config,
    credentials: context.credentials || {},
  };
}
