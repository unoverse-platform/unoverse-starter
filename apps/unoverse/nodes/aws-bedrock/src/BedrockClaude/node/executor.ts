/**
 * BedrockClaude node implementation for GravityWorkflow
 * Handles text generation using AWS Bedrock Claude models
 */

import { PromiseNode, type NodeExecutionContext, type ValidationResult } from "@unoverse-platform/plugin-base";
import { callBedrockClaude } from "../service/claude";
import { BedrockClaudeConfig, BedrockClaudeOutput } from "../util/types";

export default class BedrockClaudeExecutor extends PromiseNode {
  constructor() {
    super("BedrockClaude");
  }

  protected async validateConfig(config: BedrockClaudeConfig): Promise<ValidationResult> {
    // Keep it simple - let the service validate
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: BedrockClaudeConfig,
    context: NodeExecutionContext,
  ): Promise<BedrockClaudeOutput> {
    const nodeId = context.nodeId;
    const startTime = Date.now();

    this.logger.info(`🚀 [BedrockClaude] Starting execution for node: ${nodeId}`);

    // Build credential context for the service
    const credentialContext = this.buildCredentialContext(context);

    // Call the Bedrock service with context.api for dependency injection
    const executionId = context.executionId || context.workflow?.runId || `exec_${Date.now()}`;
    const result = await callBedrockClaude(config, credentialContext, context.api, {
      workflowId: context.workflowId || context.workflow?.id || "",
      executionId,
      nodeId: context.nodeId,
    });

    // Flatten output to match other nodes' structure
    let outputText = result.text;

    // If tools were used, prefer tool output over text
    if (result.toolUse && result.toolUse.toolInput) {
      outputText = result.toolUse.toolInput;
    }

    const finalResult = {
      __outputs: {
        output: outputText,
        usage: result.usage,
        toolUse: result.toolUse,
      },
    };

    this.logger.info(
      `🎯 [BedrockClaude] Returning result for node: ${nodeId}, total execution: ${Date.now() - startTime}ms`,
    );

    return finalResult;
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
