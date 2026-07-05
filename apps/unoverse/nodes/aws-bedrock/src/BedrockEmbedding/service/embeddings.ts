/**
 * AWS Bedrock embeddings service
 * Handles text embedding generation via AWS Bedrock
 */
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { initializeBedrockClient, initializeBedrockClientWithCredentials, AWSCredentials } from "../../shared/client";

export interface BedrockConfig {
  model?: string;
  dimensions?: number;
  normalize?: boolean;
}

/**
 * Generate a single embedding using AWS Bedrock
 */
export async function generateEmbedding(
  text: string,
  config: BedrockConfig,
  contextOrCredentials: any,
  api?: any
): Promise<number[]> {
  const logger = api?.createLogger?.("BedrockEmbedding") || console;

  // Determine if we have direct credentials or need to fetch them
  let client;
  if ("accessKeyId" in contextOrCredentials) {
    // Pattern A: Direct credentials
    client = initializeBedrockClientWithCredentials(contextOrCredentials);
  } else {
    // Pattern B: Credential context (requires api)
    client = await initializeBedrockClient(contextOrCredentials, api);
  }

  const model = config.model || "amazon.titan-embed-text-v2:0";
  const dimensions = config.dimensions || 1024;

  // Build request body based on model version
  const requestBody: any = {
    inputText: text,
  };

  // Titan v2 supports configurable dimensions
  if (model.includes("v2")) {
    requestBody.dimensions = dimensions;
    if (config.normalize !== undefined) {
      requestBody.normalize = config.normalize;
    }
  }

  try {
    const command = new InvokeModelCommand({
      modelId: model,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(requestBody),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return responseBody.embedding;
  } catch (error: any) {
    logger.error(`AWS Bedrock embedding generation failed`, {
      error: error.message,
      model,
      textLength: text.length,
    });
    throw error;
  }
}

/**
 * Generate embeddings for multiple texts in batch
 */
export async function generateBatchEmbeddings(
  texts: string[],
  config: BedrockConfig,
  contextOrCredentials: any,
  api?: any
): Promise<number[][]> {
  // AWS Bedrock doesn't support true batch processing,
  // so we process texts sequentially
  const embeddings: number[][] = [];

  for (const text of texts) {
    const embedding = await generateEmbedding(text, config, contextOrCredentials, api);
    embeddings.push(embedding);
  }

  return embeddings;
}
