import { getPlatformDependencies, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import { DynamoDBServiceExecutor } from "./executor";

export const NODE_TYPE = "DynamoDBService";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();
  
  return {
    packageVersion: "1.1.0",
    type: NODE_TYPE,
    name: "DynamoDB Service",
    description: "Provides DynamoDB operations as a service for other nodes",
    whenToUse:
      "Give an agent key-value reads and writes against a DynamoDB table — put, get, query, scan, delete, update — run on demand by the agent itself. Use it when the agent needs the full operation set or must issue queries dynamically, rather than one fixed inline read or write. Attach via a service edge to an agent node.",
    category: "Storage & Data",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751473913/gravity/icons/DynamoDB.png",
    color: "#4B61D1", // AWS DynamoDB Blue

    // Node template for styling
    template: "service", // Options: "standard", "service", "mini"

    // No inputs/outputs for service nodes
    inputs: [],
    outputs: [],

    // SERVICE CONNECTORS - defines what services this node provides
    serviceConnectors: [
      {
        name: "nosqlService",
        description: "Provides NoSQL database operations",
        serviceType: "nosql",
        methods: ["put", "get", "query", "scan", "delete", "update"],
        isService: true, // This node PROVIDES NoSQL services to others
      },
    ],

    // Configuration schema
    configSchema: {
      type: "object",
      required: [],
      properties: {
        region: {
          type: "string",
          title: "AWS Region",
          description: "AWS region for DynamoDB (e.g., us-east-1)",
          default: "us-east-1",
        },
        defaultTable: {
          type: "string",
          title: "Default Table",
          description: "Default table name (can be overridden per operation)",
          default: "",
        },
      },
    },

    // AWS credentials required
    credentials: [
      {
        name: "awsCredential",
        required: true,
      },
    ],
  };
}

const definition = createNodeDefinition();

export const DynamoDBServiceNode = {
  definition,
  executor: DynamoDBServiceExecutor,
};

export { createNodeDefinition };
