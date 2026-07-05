/**
 * Relay Node Definition
 * A unique node that immediately forwards any signal without respecting dependencies
 * Acts as a "wire" that instantly relays whatever it receives
 */

import { getPlatformDependencies, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import RelayExecutor from "./executor";

// Export node type constant
export const NODE_TYPE = "Relay";

// Export a function that creates the definition after platform deps are set
export function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.1.1",
    type: NODE_TYPE,
    isService: false,
    name: "Relay",
    description: "Instantly forwards any signal without waiting for dependencies",
    whenToUse: "Forward a signal downstream immediately without waiting on the normal dependency/join rules — a pass-through wire to fan a signal out or break a blocking dependency. Adds no transform: it only unwraps a single upstream output and re-times/re-routes the signal, existing purely for control-flow rewiring rather than data manipulation.",
    category: "Flow",
    color: "#10B981", // Green color for "go" signal
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1749961542/gravity/icons/arrow-right.png",

    inputs: [
      {
        name: "signal",
        type: NodeInputType.ANY,
        description: "Signal to relay to downstream nodes",
      },
    ],

    outputs: [
      {
        name: "signal",
        type: NodeInputType.ANY,
        description: "Relayed signal",
      },
    ],

    // No config needed - just passes through all inputs
    configSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    // Sample for the workbench "Load sample" button. Relay unwraps a single upstream
    // output, so the signal carries a {sourceNode: {outputHandle: data}} shape.
    testData: {
      config: {},
      inputs: { signal: { upstream1: { output: { message: "relay me" } } } },
    },
  };
}

// Export as enhanced node
export const RelayNode = {
  definition: createNodeDefinition(),
  executor: RelayExecutor,
};

// Export for node registry
export const definition = createNodeDefinition();
