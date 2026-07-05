/**
 * BedrockEmbeddingService service methods
 * These methods are exposed to other nodes via service calls
 */

import { type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { generateEmbedding } from "../../BedrockEmbedding/service/embeddings";
import {
  validateEmbeddingText,
  validateBedrockConfig as validateModelConfig,
} from "../../BedrockEmbedding/util/validation";

/**
 * Service method: Create a single embedding
 */
export const createEmbedding = async (params: any, config: any, context: NodeExecutionContext): Promise<any> => {
  const logger = context.api?.createLogger?.("BedrockEmbeddingService") || console;

  const { text } = params;
  const processedText = text?.trim() || "";

  // Validate text
  const textValidation = validateEmbeddingText(processedText);
  if (!textValidation.success) {
    throw new Error(textValidation.error);
  }

  logger.info("BedrockEmbeddingService createEmbedding called", {
    textLength: processedText.length,
    textPreview: processedText.substring(0, 50),
    config,
    configModel: config.model,
    configDimensions: config.dimensions,
    configNormalize: config.normalize,
  });

  // Build config for AWS service
  const bedrockConfig = {
    model: config.model,
    dimensions: config.dimensions ? parseInt(config.dimensions, 10) : undefined,
    normalize: config.normalize,
  };

  const configValidation = validateModelConfig(bedrockConfig);
  if (!configValidation.success) {
    throw new Error(configValidation.error);
  }

  // Build credential context
  const credentialContext = buildCredentialContext(context, "BedrockEmbeddingService");

  logger.info("Calling generateEmbedding with config", {
    model: bedrockConfig.model,
    dimensions: bedrockConfig.dimensions,
    normalize: bedrockConfig.normalize,
    textLength: processedText.length,
  });

  // Generate embedding using shared service with credential context and api
  const embedding = await generateEmbedding(processedText, bedrockConfig, credentialContext, context.api);

  logger.info("Embedding generated successfully", {
    embeddingLength: embedding.length,
    firstValues: embedding.slice(0, 5),
  });

  return {
    embedding,
    dimensions: embedding.length,
    model: bedrockConfig.model,
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
