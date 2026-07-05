/**
 * BedrockEmbedding node executor
 */

import { PromiseNode, type NodeExecutionContext, type ValidationResult } from "@gravity-platform/plugin-base";
import { generateEmbedding } from "../service/embeddings";

export interface BedrockEmbeddingConfig {
  textTemplate: string;
  model: string;
  dimensions?: number;
  normalize?: boolean;
}

export interface BedrockEmbeddingOutput {
  __outputs: {
    embedding: {
      embedding: number[];
      dimensions: number;
      model: string;
    };
  };
}

export default class BedrockEmbeddingExecutor extends PromiseNode {
  constructor() {
    super("BedrockEmbedding");
  }

  protected async validateConfig(config: BedrockEmbeddingConfig): Promise<ValidationResult> {
    // Validate text
    if (!config.textTemplate) {
      return { success: false, error: "Text is required for embedding generation" };
    }
    if (config.textTemplate.length > 8192) {
      return { success: false, error: "Text exceeds maximum length of 8192 characters" };
    }

    // Validate model
    if (!config.model) {
      return { success: false, error: "Model is required" };
    }

    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: BedrockEmbeddingConfig,
    context: NodeExecutionContext
  ): Promise<BedrockEmbeddingOutput> {
    // Get text from config.textTemplate (which is already resolved by the template system)
    const text = config.textTemplate;

    this.logger.info("Generating embedding using AWS Bedrock", {
      model: config.model,
      textLength: text?.length || 0,
      dimensions: config.dimensions,
      normalize: config.normalize,
    });

    try {
      // Build config
      const bedrockConfig = {
        model: config.model,
        dimensions: config.dimensions,
        normalize: config.normalize,
      };

      // Build credential context
      const credentialContext = this.buildCredentialContext(context);

      // Call shared service with credential context and api
      const embedding = await generateEmbedding(text, bedrockConfig, credentialContext, context.api);

      this.logger.info("Successfully generated embedding", {
        dimensions: embedding.length,
        expectedDimensions: config.dimensions,
      });

      return {
        __outputs: {
          embedding: {
            embedding: embedding,
            dimensions: embedding.length,
            model: config.model,
          },
        },
      };
    } catch (error: any) {
      // Provide helpful error messages
      if (error.message?.includes("ValidationException")) {
        throw new Error("Invalid model or parameters for Bedrock");
      }
      if (error.message?.includes("AccessDeniedException")) {
        throw new Error("AWS credentials lack permission to access Bedrock");
      }
      if (error.message?.includes("ResourceNotFoundException")) {
        throw new Error("Selected model not available in your AWS region");
      }

      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Build credential context from execution context
   */
  private buildCredentialContext(context: NodeExecutionContext) {
    const { workflowId, executionId, nodeId } = this.validateAndGetContext(context);

    return {
      workflowId,
      executionId,
      nodeId,
      nodeType: this.nodeType,
      config: context.config,
      credentials: context.credentials || {},
    };
  }
}
