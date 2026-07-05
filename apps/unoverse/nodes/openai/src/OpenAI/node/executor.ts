/**
 * OpenAI Node Executor
 * Handles text generation using OpenAI's GPT models
 */

import { PromiseNode, type NodeExecutionContext, type ValidationResult } from "@unoverse-platform/plugin-base";
import { queryChatGPT } from "../service/queryChatGPT";
import { validateOpenAIConfig } from "../util/validation";
import { OpenAIConfig, OpenAIOutput } from "../util/types";

export default class OpenAIExecutor extends PromiseNode {
  constructor() {
    super("OpenAI");
  }

  protected async validateConfig(config: OpenAIConfig): Promise<ValidationResult> {
    return validateOpenAIConfig(config);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: OpenAIConfig,
    context: NodeExecutionContext
  ): Promise<OpenAIOutput> {
    // Build credential context for the service
    const credentialContext = this.buildCredentialContext(context);

    // Call completion service with context.api for dependency injection
    const result = await queryChatGPT(config, credentialContext, context.api, {
      workflowId: context.workflowId || context.workflow?.id || "",
      executionId: context.executionId,
      nodeId: context.nodeId,
    });

    return {
      __outputs: {
        text: result.text,
        usage: result.usage,
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
