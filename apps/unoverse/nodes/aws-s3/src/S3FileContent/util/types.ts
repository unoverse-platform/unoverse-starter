/**
 * Type definitions for S3FileContent node
 */

export interface S3FileContentConfig {
  bucket?: string; // Optional override for bucket
  file?: {
    key: string;
    bucket?: string;
    size?: number;
    lastModified?: string;
    etag?: string;
    universalId?: string;
  }; // File object from upstream nodes (e.g., Loop node)
}

export interface S3FileContentInput {
  file: {
    key: string;
    bucket?: string;
    size?: number;
    lastModified?: string;
    etag?: string;
    universalId?: string;
  };
}

export interface S3FileContentServiceOutput {
  key: string;
  content?: string; // Base64 encoded content (optional to prevent subscription issues)
  size: number;
  bucket: string;
  lastModified?: string;
  etag?: string;
  universalId?: string; // Passed through from input for consistent file tracking
  downloadUrl?: string; // Presigned URL for direct download
}

export interface S3FileContentOutput {
  __outputs: {
    fileContent: S3FileContentServiceOutput;
  };
}

// Executor output structure with __outputs wrapper
export interface S3FileContentExecutorOutput {
  __outputs: {
    fileContent: S3FileContentServiceOutput;
  };
}
