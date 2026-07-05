/**
 * Type definitions for S3Files node
 */

export interface S3FilesConfig {
  bucket: string;
  prefix?: string;
  maxFiles?: number;
  extensions?: string;
  randomSelection?: boolean;
  generatePresignedUrls?: boolean;
  presignedUrlExpiry?: number;
}

export interface S3FileObject {
  key: string;
  size: number;
  lastModified: string;
  etag?: string;
  bucket: string;
  universalId: string; // Unique identifier for tracking files across systems
  presignedUrl?: string; // Presigned download URL (if generatePresignedUrls is enabled)
}

export interface S3FilesOutput {
  __outputs: {
    files: S3FileObject[];
    count: number;
  };
}

// Executor output structure with __outputs wrapper
export interface S3FilesExecutorOutput {
  __outputs: {
    files: S3FileObject[];
    count: number;
  };
}
