/**
 * Code Node Definition
 * Executes custom JavaScript code with input data
 */

import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import CodeExecutor from "./executor";

// Export node type constant
export const NODE_TYPE = "Code";

// Export a function that creates the definition after platform deps are set
export function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.1.1",
    type: NODE_TYPE,
    isService: false,
    name: "Code",
    description: "Execute custom code to transform data",
    category: "Flow",
    color: "#f59e0b", // Amber color for code/logic
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1750052178/gravity/icons/6359572-200.png",
    inputs: [
      {
        name: "signal",
        type: NodeInputType.ANY,
      },
    ],
    outputs: [
      { name: "output", type: NodeInputType.ANY },
      { name: "ids", type: NodeInputType.OBJECT },
    ],
    // Schema for the node configuration UI
    configSchema: {
      type: "object",
      properties: {
        code: {
          type: "object",
          title: "Code",
          description: "JS Code to transform data",
          default: "",
          "ui:field": "template",
        },
        generateIds: {
          type: "boolean",
          title: "Generate IDs",
          description: "Generate content IDs",
          default: false,
          "ui:widget": "toggle",
        },
        saveToContext: {
          type: "boolean",
          title: "Save to Context",
          description: "Save output to workflow context for template access",
          default: false,
          "ui:widget": "toggle",
        },
      },
      required: ["code"],
    },
    // Declare capabilities
    capabilities: {
      isTrigger: false,
    },
  };
}

// Export as enhanced node
export const CodeNode = {
  definition: createNodeDefinition(),
  executor: CodeExecutor,
};

// Export for node registry
export const definition = createNodeDefinition();
