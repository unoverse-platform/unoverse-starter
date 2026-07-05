import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import MCPExecutor from "./executor";

export const NODE_TYPE = "MCP";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.1.1",
    type: NODE_TYPE,
    name: "MCP Service",
    description: "Model Context Protocol service node that handles schema-based service requests",
    whenToUse: "Expose your OWN custom tools to an agent from an inline JSON schema — define each tool's name, description, and input/output shape and let the agent call them. Reach for this only when no purpose-built service node already covers the job; attach via a service edge to an agent node.",
    category: "Flow",
    color: "#8B5CF6", // Purple color for service nodes

    // Node template for styling
    template: "service", // Options: "standard", "service", "mini"

    // This service node ALSO has workflow connections
    inputs: [
      {
        name: "response",
        type: NodeInputType.OBJECT,
        description: "Response from the connected node handling the service request",
        required: false
      }
    ],
    outputs: [
      {
        name: "request",
        type: NodeInputType.OBJECT,
        description: "Service request forwarded to connected node"
      }
    ],

    // SERVICE CONNECTORS - defines what services this node provides
    serviceConnectors: [
      {
        name: "mcpService",
        description: "Provides Model Context Protocol services",
        serviceType: "mcp",
        methods: ["getSchema", "getChunksByQuery"],
        isService: true, // This node PROVIDES MCP services to others
      },
    ],

    // Configuration schema - holds the service schema
    configSchema: {
      type: "object",
      properties: {
        serviceSchema: {
          type: "object",
          title: "Service Schema",
          description: "JSON schema defining the service methods and their input/output formats",
          default: {},
          "ui:field": "JSON",
        },
      },
      required: ["serviceSchema"],
    },

    // Node capabilities
    capabilities: {
      isTrigger: false,
    },
    // No testData: this is a service node (isService:true) — it only responds to
    // SERVICE_CALL via handleServiceCall and its executeNode throws, so it is not
    // runnable standalone in the bench. Service nodes don't carry a Load-sample.
  };
}

const definition = createNodeDefinition();

export const MCPNode = {
  definition,
  executor: MCPExecutor,
};

export { createNodeDefinition };
