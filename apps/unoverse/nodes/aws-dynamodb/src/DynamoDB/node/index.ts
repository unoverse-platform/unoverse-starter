import { getPlatformDependencies, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import { DynamoDBExecutor } from "./executor";

export const NODE_TYPE = "DynamoDB";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();
  
  return {
    packageVersion: "1.1.0",
    type: NODE_TYPE,
    name: "DynamoDB",
    description: "Upload a record to an AWS DynamoDB table",
    whenToUse:
      "Writes (puts) ONE record into a DynamoDB table as a pipeline step — a single-shot NoSQL write. Use it specifically to put one item to DynamoDB inline; reading a record, or exposing the full operation set to a consumer, are different jobs.",
    category: "Storage & Data",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751473913/gravity/icons/DynamoDB.png",
    color: "#4B61D1", // AWS DynamoDB Blue

    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Record data to upload (can override config record)",
      },
    ],

    outputs: [
      {
        name: "success",
        type: NodeInputType.BOOLEAN,
        description: "Whether the upload was successful",
      },
      {
        name: "itemId",
        type: NodeInputType.STRING,
        description: "ID of the uploaded item (if available)",
      },
    ],

    configSchema: {
      type: "object",
      required: ["tableName", "record"],
      properties: {
        tableName: {
          type: "string",
          title: "Table Name",
          description: "Name of the DynamoDB table",
        },
        record: {
          type: "object",
          title: "Code",
          description: "JS Code to transform data",
          default: "",
          "ui:field": "template",
        },
        conditionExpression: {
          type: "string",
          title: "Condition Expression",
          description: "Optional condition that must be satisfied for the put to succeed",
          default: "",
        },
        expressionAttributeNames: {
          type: "object",
          title: "Expression Attribute Names",
          description: "Substitution tokens for attribute names in expressions (optional)",
          default: {},
          "ui:field": "JSON",
        },
        expressionAttributeValues: {
          type: "object",
          title: "Expression Attribute Values",
          description: "Values that can be substituted in expressions (optional)",
          default: {},
          "ui:field": "JSON",
        },
      },
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
        record: { universalId: "user-1001", name: "Ada Lovelace", email: "ada@example.com", createdAt: "2026-06-27T12:00:00Z" },
        conditionExpression: "attribute_not_exists(universalId)",
        expressionAttributeNames: {},
        expressionAttributeValues: {},
      },
      inputs: { signal: {} },
    },
  };
}

const definition = createNodeDefinition();

export const DynamoDBNode = {
  definition,
  executor: DynamoDBExecutor,
};

export { createNodeDefinition };
