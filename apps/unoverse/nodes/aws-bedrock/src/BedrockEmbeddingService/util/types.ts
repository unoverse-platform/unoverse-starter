/**
 * Type definitions for BedrockEmbeddingService node
 */

export interface BedrockEmbeddingServiceConfig {
  model: string;
  normalize?: boolean;
  dimensions?: number;
  textTemplate?: string;
}

export interface EmbeddingServiceResult {
  embedding: number[];
  dimensions: number;
  model: string;
}

export interface BatchEmbeddingServiceResult {
  embeddings: number[][];
  dimensions: number;
  model: string;
  count: number;
}
