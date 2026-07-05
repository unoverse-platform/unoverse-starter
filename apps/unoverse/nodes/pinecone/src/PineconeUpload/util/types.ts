/**
 * Type definitions for PineconeUpload node
 */

export interface PineconeUploadConfig {
  indexName: string;
  namespace?: string;
  vectorId: string;
  text: string;
  metadata?: any;
  enableChunking?: boolean;
  chunkingStrategy?: "fixed" | "sentence" | "paragraph";
  maxChunkSize?: number;
  chunkOverlap?: number;
}

export interface PineconeUploadServiceOutput {
  success: boolean;
  vectorId: string;
  namespace: string;
  timestamp: string;
  vectorCount: number;
  summary: {
    url?: string;
    title?: string;
    totalTextLength: number;
    chunkingEnabled: boolean;
    chunkingStrategy?: string;
    chunks?: {
      count: number;
      avgSize: number;
      minSize: number;
      maxSize: number;
    };
  };
  uploadedVectors: Array<{
    id: string;
    chunkIndex?: number;
    textLength: number;
    preview: string;
  }>;
}

export interface PineconeUploadOutput {
  __outputs: {
    output: PineconeUploadServiceOutput;
  };
}
