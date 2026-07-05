/**
 * Type definitions for DocumentParser node
 */

export interface DocumentParserConfig {
  parserType?: 'auto' | 'pdf' | 'docx' | 'txt';
  maxFileSizeMB?: number;
  file: {
    key: string;
    content: Buffer | string; // Buffer or base64 string
    size?: number;
    bucket?: string; // Optional, from upstream node
    universalId?: string; // Optional, from upstream node
    downloadUrl?: string; // Optional, presigned URL from upstream node
  };
}

export interface DocumentParserInput {
}

export interface DocumentParserOutput {
  fileKey: string;
  text: string;
  pageCount?: number;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    creationDate?: string;
    modificationDate?: string;
    [key: string]: any;
  };
  fileType: 'pdf' | 'docx' | 'txt';
  fileSize?: number;
  // S3 information for later download
  bucket?: string;
  universalId?: string;
  downloadUrl?: string; // Presigned URL for direct download
  contentId?: string; // Hash of document content for change detection
}

// Executor output structure with __outputs wrapper
export interface DocumentParserExecutorOutput {
  __outputs: {
    output: DocumentParserOutput;
  };
}
