import {
  getPlatformDependencies,
  type EnhancedNodeDefinition,
} from "@gravity-platform/plugin-base";
import SmartDocumentExecutor from "./executor";

export const NODE_TYPE = "SmartDocument";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "0.1.0",
    type: NODE_TYPE,
    name: "Smart Document",
    description:
      "Agent-managed long-form markdown document. Exposes view / create / str_replace / insert as MCP tools.",
    category: "Agent Tools",
    color: "#10b981",
    template: "service",
    logoUrl:
      "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    inputs: [],
    outputs: [
      {
        name: "markdown",
        type: NodeInputType.STRING,
        description: "Current markdown content",
      },
    ],
    serviceConnectors: [
      {
        name: "mcpService",
        description:
          "MCP tools for a single agent to read and edit this markdown document",
        serviceType: "mcp",
        // getSchema is a meta-method (tool discovery) and must NOT be listed here.
        // See docs/MCP_COMPLETE_GUIDE.md §"getSchema called multiple times".
        methods: ["view", "create", "str_replace", "insert"],
        isService: true,
      },
    ],
    configSchema: {
      type: "object",
      properties: {
        initialMarkdown: {
          type: "string",
          title: "Initial content",
          description:
            "Seeded into Redis when the node first executes. Supports {{input.field}} templating.",
          default: "",
          "ui:field": "template",
        },
      },
      required: [],
    },
    credentials: [],
    capabilities: { isTrigger: false },
  };
}

const definition = createNodeDefinition();

export const SmartDocumentNode = {
  definition,
  executor: SmartDocumentExecutor,
};

export { createNodeDefinition };
