/**
 * AWS Bedrock Embedding Node
 * Generates vector embeddings using AWS Bedrock's Titan embedding models
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import BedrockEmbeddingExecutor from "./executor";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.1.0",
    type: "BedrockEmbedding",
    name: "Bedrock Embedding",
    description: "Generate vector embeddings from text using AWS Bedrock Titan models",
    whenToUse:
      "Embed text into a vector for semantic search, similarity, clustering, or RAG indexing — inline in the data flow, producing one precomputed vector per call via AWS Titan models. Pick this when embedding is an ordinary pipeline step that hands its vector straight downstream.",
    category: "AI",
    color: "#10a37f",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1749137717/gravity/icons/vdyfnijyuyk8ajqtp3nu.webp",

    inputs: [
      {
        name: "text",
        type: NodeInputType.STRING,
        description: "Text to convert into embeddings",
      },
    ],

    outputs: [
      {
        name: "embedding",
        type: NodeInputType.OBJECT,
        description: "The embedding vector array",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        model: {
          type: "string",
          title: "Model",
          description: "Select the Bedrock embedding model to use",
          enum: ["amazon.titan-embed-text-v2:0", "amazon.titan-embed-text-v1"],
          enumNames: ["Titan Text Embeddings v2", "Titan Text Embeddings v1"],
          default: "amazon.titan-embed-text-v2:0",
        },
        normalize: {
          type: "boolean",
          title: "Normalize Embeddings",
          description: "Whether to normalize the embedding vectors (recommended for similarity search)",
          default: true,
          "ui:widget": "toggle",
        },
        dimensions: {
          type: "number",
          title: "Output Dimensions",
          description: "Number of dimensions for the output embedding",
          enum: [256, 512, 1024],
          enumNames: ["256 dimensions", "512 dimensions", "1024 dimensions"],
          default: 1024,
        },
        textTemplate: {
          type: "string",
          title: "Text Template",
          description:
            "Optional template to transform input text before embedding. Use {{text}} to reference the input.",
          default: "{{text}}",
          "ui:field": "template",
        },
      },
      required: ["model"],
    },

    credentials: [
      {
        name: "awsCredential",
        required: true,
        displayName: "AWS Credentials",
        description: "AWS credentials for accessing Bedrock",
      },
    ],

    testData: {
      config: {
        model: "amazon.titan-embed-text-v2:0",
        normalize: true,
        dimensions: 1024,
      },
      inputs: {
        text: "AWS Bedrock provides access to foundation models from leading AI companies through a single API.",
      },
    },
  };
}

const definition = createNodeDefinition();

export const BedrockEmbeddingNode = {
  definition,
  executor: BedrockEmbeddingExecutor,
};

export { definition };
