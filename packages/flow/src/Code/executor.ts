/**
 * Code Node Executor
 * Executes custom JavaScript code with access to inputs and context
 *
 * Security considerations:
 * - Runs in isolated VM context
 * - Limited access to Node.js APIs
 * - Timeout protection
 * - Memory limits
 */

import { NodeExecutionContext, ValidationResult } from "@gravity-platform/plugin-base";
import { PromiseNode, codeLogger } from "../shared/platform";
import { createContentHash, createUniversalId } from "./utils/hashUtils";

interface CodeConfig {
  code: any; // Can be a string or already-resolved object from template
  generateIds?: boolean; // Toggle for generating universalId and contentId
  saveToContext?: boolean; // Toggle for saving output to workflow context
}

export default class CodeExecutor extends PromiseNode<CodeConfig> {
  constructor() {
    super("Code");
  }

  protected async validateConfig(config: CodeConfig): Promise<ValidationResult> {
    // Config validation happens in the template resolver
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: CodeConfig,
    context: NodeExecutionContext,
  ): Promise<any> {
    try {
      // The template resolver has already executed the code if it was a JS template
      // If config.code is already resolved, just use it
      const result = config.code;

      // Build base output
      const outputs: any = {
        output: result,
      };

      // If generateIds is enabled, also generate IDs
      if (config.generateIds) {
        const workflowId = context.workflow?.id || "unknown";
        const nodeId = context.nodeId || "code";

        // Include the result content in the universalId hash
        const universalId = createUniversalId(workflowId, nodeId, result);
        const contentId = createContentHash(result);

        codeLogger.info("Generated IDs for output", {
          workflowId,
          nodeId,
          universalId,
          contentId,
        });

        outputs.ids = {
          universalId,
          contentId,
        };
      }

      // If saveToContext is enabled, write to Redis AND flag output for in-memory cache
      if (config.saveToContext) {
        outputs.__saveToContext = true;
        if (context.api?.getRedisClient) {
          const redis = context.api.getRedisClient();
          const redisKey = `saved:${context.executionId}`;
          await redis.hset(redisKey, context.nodeId, JSON.stringify(result));
          await redis.expire(redisKey, 3600);
          codeLogger.info("Saved output to Redis", { nodeId: context.nodeId, redisKey });
        }
      }

      return { __outputs: outputs };
    } catch (error: any) {
      codeLogger.error(`Code execution failed:`, error);
      throw new Error(`Code execution failed: ${error.message}`);
    }
  }
}
