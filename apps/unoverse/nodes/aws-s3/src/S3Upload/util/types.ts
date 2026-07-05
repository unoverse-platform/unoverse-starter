/**
 * Type definitions for S3Upload node
 */

export interface S3UploadConfig {
  bucket: string;
  key: string;
  sourceUrl?: string;
  base64Data?: string;
  contentType?: string;
}

export interface S3UploadOutput {
  key: string;
  bucket: string;
  s3Url: string;
  downloadUrl: string;
  size: number;
  contentType: string;
}

export interface S3UploadExecutorOutput {
  __outputs: {
    output: S3UploadOutput;
  };
}
