/**
 * Type definitions for BedrockEmbedding node
 */

export interface BedrockConfig {
  model?: string;
  dimensions?: number;
  normalize?: boolean;
}

/**
 * Result of embedding generation
 */
export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
  model: string;
}

/**
 * Result of batch embedding generation
 */
export interface BatchEmbeddingResult {
  embeddings: number[][];
  count: number;
  model: string;
}

/**
 * Error response structure
 */
export interface EmbeddingError {
  error: string;
  code?: string;
  details?: any;
}

/**
 * Configuration for BedrockEmbedding node
 */
export interface BedrockEmbeddingConfig {
  textTemplate: string;
  model: string;
  dimensions?: number;
  normalize?: boolean;
}

/**
 * Service output data for BedrockEmbedding node
 */
export interface BedrockEmbeddingServiceOutput {
  embedding: number[];
  dimensions: number;
  model: string;
}

/**
 * Output for BedrockEmbedding node with __outputs wrapper
 */
export interface BedrockEmbeddingOutput {
  __outputs: {
    embedding: BedrockEmbeddingServiceOutput;
  };
}
