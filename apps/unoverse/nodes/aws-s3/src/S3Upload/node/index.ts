import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import { S3UploadExecutor } from "./executor";

export const NODE_TYPE = "S3Upload";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "S3 Upload",
    description: "Upload file to S3 from URL or buffer",
    whenToUse:
      "Writes a file into S3 from a URL or base64 data and returns the s3Url/key. Use it to STORE a file in your own AWS S3 bucket; it writes (not reads) and targets S3 specifically.",
    category: "Storage & Data",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1749916163/gravity/icons/Amazon-S3-Logo.svg.png",
    color: "#FF9900",

    inputs: [
      {
        name: "data",
        type: NodeInputType.OBJECT,
        description: "Data containing sourceUrl or buffer to upload",
      },
    ],

    outputs: [
      {
        name: "output",
        type: NodeInputType.OBJECT,
        description: "Upload result with s3Url, key, bucket, size",
      },
    ],

    configSchema: {
      type: "object",
      required: ["bucket", "key"],
      properties: {
        bucket: {
          type: "string",
          title: "S3 Bucket",
          description: "Target S3 bucket name",
        },
        key: {
          type: "string",
          title: "S3 Key",
          description: "File path/key in S3. Supports {{signal.inputtrigger1.output.filename}} syntax.",
          "ui:field": "template",
        },
        sourceType: {
          type: "string",
          title: "Source Type",
          description: "Choose the input source type",
          enum: ["url", "base64"],
          enumNames: ["URL", "Base64 Data"],
          default: "base64",
        },
        sourceUrl: {
          type: "string",
          title: "Source URL",
          description: "URL to fetch file from. Supports {{signal.inputtrigger1.output.url}} syntax.",
          "ui:field": "template",
          "ui:dependencies": {
            sourceType: "url",
          },
        },
        base64Data: {
          type: "string",
          title: "Base64 Data",
          description: "Base64 encoded file data. Supports {{signal.<sourceNodeId>.<outputHandle>.<field>}} syntax. Can include data URL prefix.",
          "ui:field": "template",
          "ui:dependencies": {
            sourceType: "base64",
          },
        },
        contentType: {
          type: "string",
          title: "Content Type",
          description: "MIME type (auto-detected if not provided)",
        },
      },
    },

    credentials: [
      {
        name: "awsCredential",
        required: true,
        displayName: "AWS",
        description: "AWS credentials for S3 access",
      },
    ],

    testData: {
      config: {
        bucket: "my-app-bucket",
        key: "uploads/hello.txt",
        sourceType: "base64",
        base64Data: "SGVsbG8sIFMzIHdvcmxkIQ==",
        contentType: "text/plain",
      },
      inputs: { data: { base64: "SGVsbG8sIFMzIHdvcmxkIQ==" } },
    },
  };
}

const definition = createNodeDefinition();

export const S3UploadNode = {
  definition,
  executor: S3UploadExecutor,
};

export { createNodeDefinition };
