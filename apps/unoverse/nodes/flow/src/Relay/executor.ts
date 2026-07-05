/**
 * Relay Node Executor
 * Combines all inputs and immediately forwards them as a single output signal
 */

import { NodeExecutionContext, ValidationResult } from "@unoverse-platform/plugin-base";
import { PromiseNode } from "../shared/platform";

interface RelayConfig {
  // No config needed
}

export default class RelayExecutor extends PromiseNode<RelayConfig> {
  constructor() {
    super("Relay");
  }

  protected async validateConfig(config: RelayConfig): Promise<ValidationResult> {
    // No validation needed - relay accepts anything
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: RelayConfig,
    context: NodeExecutionContext
  ): Promise<any> {
    // Log what we're relaying
    console.log(" Relay node executing", {
      hasInputs: !!inputs,
      inputKeys: Object.keys(inputs),
      inputCount: Object.keys(inputs).length,
    });

    // Extract the actual signal data from the inputs
    // The inputs come in as { signal: { sourceNode: { outputHandle: data } } }
    // We want to forward just the data, not the nested structure
    let outputData = {};
    
    // If we have a signal input, extract the data from it
    if (inputs.signal) {
      // Get the first source node's data
      const sourceNodes = Object.keys(inputs.signal);
      if (sourceNodes.length > 0) {
        const sourceNode = sourceNodes[0];
        const sourceData = inputs.signal[sourceNode];
        
        // If the source data has an output handle, use that
        // Otherwise use the entire source data
        if (sourceData && typeof sourceData === 'object') {
          const outputHandles = Object.keys(sourceData);
          if (outputHandles.length === 1) {
            // Single output - forward just the data
            outputData = sourceData[outputHandles[0]];
          } else {
            // Multiple outputs - forward the entire object
            outputData = sourceData;
          }
        }
      }
    } else {
      // No signal input, forward all inputs as-is
      outputData = inputs;
    }

    console.log("🚀 Relay forwarding signal", {
      inputStructure: JSON.stringify(inputs, null, 2).substring(0, 200),
      outputData: JSON.stringify(outputData, null, 2).substring(0, 200),
    });

    // Return the extracted data as the output signal
    return {
      __outputs: {
        signal: outputData,
      },
    };
  }
}

export { RelayExecutor };
