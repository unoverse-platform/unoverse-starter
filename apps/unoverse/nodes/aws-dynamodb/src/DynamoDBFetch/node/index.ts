import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import { DynamoDBFetchExecutor } from "./executor";

export const NODE_TYPE = "DynamoDBFetch";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();
  
  return {
    packageVersion: "1.1.0",
    type: NODE_TYPE,
    name: "DynamoDB Fetch",
    description: "Fetch a record from AWS DynamoDB table by key",
    whenToUse:
      "Reads a SINGLE DynamoDB record by primary (and optional sort) key, emitting the item plus a found flag. It does one keyed read inline; writing a record, or running queries/scans on demand, are different jobs.",
    category: "Storage & Data",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751473913/gravity/icons/DynamoDB.png",
    color: "#4B61D1", // AWS DynamoDB Blue

    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Input Object",
      },
    ],

    outputs: [
      {
        name: "output",
        type: NodeInputType.OBJECT,
        description: "The fetched record or null if not found",
      },
      {
        name: "found",
        type: NodeInputType.BOOLEAN,
        description: "Whether the record was found",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        tableName: {
          type: "string",
          title: "Table Name",
          description: "The name of the DynamoDB table",
        },
        primaryKey: {
          type: "string",
          title: "Primary Key Field",
          description: "The field name for the primary key (partition key)",
          default: "universalId",
          "ui:field": "template",
        },
        sortKey: {
          type: "string",
          title: "Sort Key Field",
          description: "The field name for the sort key (optional)",
          default: "",
          "ui:field": "template",
        },
      },
      required: ["tableName", "primaryKey"],
    },

    credentials: [
      {
        name: "awsCredential",
        required: true,
        displayName: "AWS",
        description: "AWS credentials for DynamoDB access",
      },
    ],

    testData: {
      config: {
        tableName: "Users",
        primaryKey: "universalId",
        sortKey: "",
      },
      inputs: { signal: { universalId: "user-1001" } },
    },
  };
}

const definition = createNodeDefinition();

export const DynamoDBFetchNode = {
  definition,
  executor: DynamoDBFetchExecutor,
};

export { createNodeDefinition };
