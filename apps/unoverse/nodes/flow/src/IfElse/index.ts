/**
 * IfElse Node Definition
 * Evaluates a condition and routes output to true or false connector
 */

import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import IfElseExecutor from "./executor";

// Export node type constant
export const NODE_TYPE = "IfElse";

// Export a function that creates the definition after platform deps are set
export function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.1.1",
    type: NODE_TYPE,
  isService: false,
  name: "If/Else",
  description: "Evaluate a condition and route to true or false output",
  whenToUse: "Branch the workflow: evaluate a boolean condition and route the same input down a true or false path so only one downstream branch runs. Reach for this when a step must fork execution rather than transform data — the upstream payload passes through unchanged on whichever single edge is chosen.",
  category: "Flow",
  color: "#4A90E2",
  logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1749961542/gravity/icons/loop.png",

  inputs: [
    {
      name: "signal",
      type: NodeInputType.ANY,
    },
  ],
  outputs: [
    { name: "true", type: NodeInputType.ANY },
    { name: "false", type: NodeInputType.ANY },
  ],
  // Schema for the node configuration UI
  configSchema: {
    type: "object",
    properties: {
      condition: {
        type: "object",
        title: "Condition",
        description: "true/false expression",
        default: "",
        "ui:field": "template",
      },
    },
    required: ["condition"],
  },
  // Sample for the workbench "Load sample" button. `condition` is a template the
  // engine resolves before run; here it's a resolved boolean so the bench routes it.
  testData: {
    config: { condition: true },
    inputs: { signal: { value: 42 } },
  },
  };
}

// Export as enhanced node
export const IfElseNode = {
  definition: createNodeDefinition(),
  executor: IfElseExecutor,
};

// Export for node registry
export const definition = createNodeDefinition();
