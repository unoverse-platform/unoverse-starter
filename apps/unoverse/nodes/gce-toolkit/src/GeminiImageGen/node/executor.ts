/**
 * Gemini Image Generation Node Executor
 * Handles image generation using Google's Gemini models
 */

import {
  getPlatformDependencies,
  type NodeExecutionContext,
  type ValidationResult,
} from "@unoverse-platform/plugin-base";
import { generateImages } from "../service";
import { GeminiImageGenConfig, GeminiImageGenOutput } from "../util/types";

// Get platform dependencies
const { PromiseNode } = getPlatformDependencies();

export default class GeminiImageGenExecutor extends PromiseNode<GeminiImageGenConfig> {
  constructor() {
    super("GeminiImageGen");
  }

  protected async validateConfig(config: GeminiImageGenConfig): Promise<ValidationResult> {
    if (!config.prompt || config.prompt.trim() === "") {
      return {
        success: false,
        error: "Prompt is required and cannot be empty",
      };
    }

    if (!config.model) {
      return {
        success: false,
        error: "Model is required",
      };
    }

    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: GeminiImageGenConfig,
    context: NodeExecutionContext,
  ): Promise<GeminiImageGenOutput> {
    // Build credential context for the service
    const credentialContext = this.buildCredentialContext(context);

    // Call image generation service with logger
    const result = await generateImages(config, credentialContext, this.logger);

    return {
      __outputs: {
        images: result.images,
        text: result.text,
        metadata: {
          model: config.model,
          imageCount: result.images.length,
          timestamp: new Date().toISOString(),
        },
      },
    };
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
