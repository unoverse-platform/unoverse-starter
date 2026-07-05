import { createLogger } from "../../shared/platform";
import { CachedDocument, DocumentInput, DocumentOutput } from "../util/types";

const logger = createLogger("DocumentCache");

export class DocumentCacheService {
  private cache: CachedDocument | null = null;

  async handleDocument(
    file: DocumentInput["file"], 
    maxFileSizeMB: number
  ): Promise<{ output: DocumentOutput | null; document: CachedDocument | null }> {
    if (!file) return { output: null, document: null };

    const documentId = file.universalId || file.key;
    if (!documentId) {
      return {
        output: {
          operation: "error",
          documentId: "unknown",
          metadata: { key: "unknown", size: 0 },
          error: "No document ID available",
          cacheStats: this.getCacheStats(),
        },
        document: null
      };
    }

    // Check file size
    if (file.size && file.size > maxFileSizeMB * 1024 * 1024) {
      logger.warn("File too large to cache", {
        documentId,
        size: file.size,
        maxSizeMB: maxFileSizeMB,
      });
      return {
        output: {
          operation: "error",
          documentId,
          metadata: { key: file.key, size: file.size || 0 },
          error: `File too large (${Math.round((file.size || 0) / 1024 / 1024)}MB > ${maxFileSizeMB}MB)`,
          cacheStats: this.getCacheStats(),
        },
        document: null
      };
    }

    // Create cached document
    const newCachedDocument: CachedDocument = {
      id: documentId,
      metadata: {
        key: file.key,
        size: file.size || 0,
        downloadUrl: file.downloadUrl,
        lastModified: file.lastModified,
        etag: file.etag,
        universalId: file.universalId,
      },
      cachedAt: new Date(),
      accessCount: 1,
      lastAccessed: new Date(),
    };

    // Cache content if provided
    if (file.content) {
      newCachedDocument.content = {
        base64: file.content,
      };
    }

    logger.info("Document cached", {
      documentId,
      size: file.size,
      hasContent: !!file.content,
    });

    // Always load content if downloadUrl available and no content provided
    if (file.downloadUrl && !file.content) {
      try {
        await this.loadDocumentContent(file.downloadUrl, newCachedDocument);
        this.cache = newCachedDocument;
        return {
          output: {
            operation: "loaded",
            documentId,
            metadata: newCachedDocument.metadata,
            // Content removed - downstream nodes fetch from downloadUrl to avoid large payloads
            cacheStats: this.getCacheStats(),
          },
          document: newCachedDocument
        };
      } catch (error: any) {
        return {
          output: {
            operation: "error",
            documentId,
            metadata: newCachedDocument.metadata,
            error: `Failed to load content: ${error.message}`,
            cacheStats: this.getCacheStats(),
          },
          document: newCachedDocument
        };
      }
    }

    this.cache = newCachedDocument;
    return {
      output: {
        operation: "cached",
        documentId,
        metadata: newCachedDocument.metadata,
        content: newCachedDocument.content,
        cacheStats: this.getCacheStats(),
      },
      document: newCachedDocument
    };
  }

  private async loadDocumentContent(downloadUrl: string, cachedDocument: CachedDocument): Promise<void> {
    logger.info("Loading document content from downloadUrl", {
      documentId: cachedDocument.id,
      downloadUrl,
    });

    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");

      cachedDocument.content = {
        base64,
        // Note: Buffer removed - not serializable over GraphQL WebSocket
      };

      logger.info("Document content loaded", {
        documentId: cachedDocument.id,
        size: buffer.byteLength,
      });
    } catch (error: any) {
      logger.error("Failed to load document content", {
        documentId: cachedDocument.id,
        downloadUrl,
        error: error.message,
      });
      throw error;
    }
  }

  private getCacheStats() {
    if (!this.cache) {
      return {
        totalCached: 0,
        memoryUsedMB: 0,
        cacheHits: 0,
        cacheMisses: 0,
      };
    }

    let memoryUsedMB = 0;
    if (this.cache.content?.buffer) {
      memoryUsedMB = this.cache.content.buffer.length / (1024 * 1024);
    } else if (this.cache.content?.base64) {
      memoryUsedMB = Buffer.byteLength(this.cache.content.base64, "base64") / (1024 * 1024);
    }

    return {
      totalCached: 1,
      memoryUsedMB: Math.round(memoryUsedMB * 100) / 100,
      cacheHits: this.cache.accessCount - 1,
      cacheMisses: 1,
    };
  }
}
