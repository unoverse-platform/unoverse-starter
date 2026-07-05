/**
 * Type definitions for Document node
 */

export interface DocumentConfig {
  file?: {
    key: string;
    downloadUrl?: string;
    content?: string; // Base64 or text
    size?: number;
    bucket?: string;
    lastModified?: string;
    etag?: string;
    universalId?: string;
  };
  maxFileSizeMB?: number; // Maximum file size to cache in MB (default: 50)
}

export interface DocumentInput {
  // Can accept various document sources
  file?: {
    key: string;
    downloadUrl?: string;
    content?: string; // Base64 or text
    size?: number;
    bucket?: string;
    lastModified?: string;
    etag?: string;
    universalId?: string;
  };
  url?: string; // Direct URL to document
  operation?: 'cache' | 'load' | 'get' | 'clear'; // Operation to perform
  documentId?: string; // For get/load operations
}

export interface DocumentOutput {
  operation: 'cached' | 'loaded' | 'accessed' | 'cleared' | 'error';
  documentId: string;
  metadata: {
    key: string;
    size: number;
    type?: string;
    downloadUrl?: string;
    lastModified?: string;
    etag?: string;
    universalId?: string;
  };
  content?: {
    text?: string;    // Parsed text content
    buffer?: Buffer;  // Raw binary content
    base64?: string;  // Base64 encoded content
  };
  cacheStats: {
    totalCached: number;
    memoryUsedMB: number;
    cacheHits: number;
    cacheMisses: number;
  };
  error?: string;
}

export interface CachedDocument {
  id: string;
  metadata: DocumentOutput['metadata'];
  content?: DocumentOutput['content'];
  cachedAt: Date;
  accessCount: number;
  lastAccessed: Date;
}

// Executor output structure with __outputs wrapper
export interface DocumentExecutorOutput {
  __outputs: {
    output: DocumentOutput;
  };
}
