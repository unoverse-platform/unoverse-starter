/**
 * Context Node Executor
 * Extracts and returns workflow context information including:
 * - userId, conversationId, chatId
 * - workflowId, executionId
 * - workflow variables
 * - execution metadata
 */

import { NodeExecutionContext, ValidationResult } from "@unoverse-platform/plugin-base";
import { PromiseNode } from "../shared/platform";

interface ContextOutput {
  userId?: string;
  conversationId?: string;
  chatId?: string;
  workflowId?: string;
  executionId?: string;
}

export class ContextExecutor extends PromiseNode {
  constructor() {
    super("Context");
  }

  protected async validateConfig(config: any): Promise<ValidationResult> {
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: any,
    context: NodeExecutionContext
  ): Promise<any> {
    try {
      // Get workflow variables for core context fields
      const workflowVars = context.workflow?.variables || {};
      
      // Build the output object with only core fields
      const output: ContextOutput = {
        userId: workflowVars?.userId,
        conversationId: workflowVars?.conversationId,
        chatId: workflowVars?.chatId,
        workflowId: context.workflow?.id,
        executionId: context.executionId,
      };

      this.logger.info("Context extracted", output);

      // Return the context data to the output connector
      return {
        __outputs: {
          context: output,
        },
      };
    } catch (error: any) {
      this.logger.error("Failed to extract context:", error);
      throw new Error(`Context extraction failed: ${error.message}`);
    }
  }
}
