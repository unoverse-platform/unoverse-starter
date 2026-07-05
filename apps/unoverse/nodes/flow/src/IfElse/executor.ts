/**
 * IfElse Node Executor
 * Evaluates a condition and routes output to the appropriate connector
 */

import { NodeExecutionContext, ValidationResult } from "@gravity-platform/plugin-base";
import { PromiseNode } from "../shared/platform";

interface IfElseConfig {
  condition: any; // Template-resolved boolean value from the condition expression
}

interface IfElseOutput {
  __outputs: {
    true?: any;
    false?: any;
  };
}

export default class IfElseExecutor extends PromiseNode<IfElseConfig> {
  constructor() {
    super("IfElse");
  }

  protected async validateConfig(config: IfElseConfig): Promise<ValidationResult> {
    // Config validation happens in the template resolver
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>, // Raw data from connected nodes
    config: IfElseConfig, // Template-resolved configuration values
    context: NodeExecutionContext
  ): Promise<IfElseOutput> {
    try {
      // Get the condition result from config (already evaluated by template resolver)
      const isTrue = Boolean(config.condition);

      this.logger.info(`IfElse condition evaluated to: ${isTrue}`, {
        nodeId: context.nodeId,
        condition: config.condition,
        isTrue,
      });

      this.logger.debug("IfElse routing decision", {
        condition: isTrue ? "true" : "false",
        inputKeys: Object.keys(inputs),
      });

      // Route to the appropriate output connector using __outputs pattern
      if (isTrue) {
        return {
          __outputs: {
            true: inputs,
          },
        };
      } else {
        return {
          __outputs: {
            false: inputs,
          },
        };
      }
    } catch (error: any) {
      this.logger.error(`IfElse condition evaluation failed:`, error);
      throw new Error(`IfElse condition evaluation failed: ${error.message}`);
    }
  }
}
