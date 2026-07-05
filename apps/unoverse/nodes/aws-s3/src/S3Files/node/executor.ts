import {
  getPlatformDependencies,
  type NodeExecutionContext,
  type ValidationResult,
} from "@unoverse-platform/plugin-base";
import { S3FilesConfig, S3FilesExecutorOutput, S3FileObject } from "../util/types";
import { listS3Files } from "../service/s3Service";
import { createHash } from "crypto";

const { PromiseNode, createLogger } = getPlatformDependencies();

const NODE_TYPE = "S3Files";

export default class S3FilesExecutor extends PromiseNode<S3FilesConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async validateConfig(config: S3FilesConfig): Promise<ValidationResult> {
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: S3FilesConfig,
    context: NodeExecutionContext,
  ): Promise<S3FilesExecutorOutput> {
    const logger = createLogger("S3Files");

    // Build credential context for service
    const credentialContext = this.buildCredentialContext(context);

    logger.info("Starting S3 file listing", {
      bucket: config.bucket,
      prefix: config.prefix,
      maxFiles: config.maxFiles,
    });

    try {
      // First, fetch a larger pool of files to randomly select from
      const requestedFiles = config.maxFiles || 10;
      const poolSize = Math.min(1000, requestedFiles * 10); // Get up to 10x more files, max 1000

      // Use S3 service to list files
      const allFiles = await listS3Files(
        {
          bucket: config.bucket,
          prefix: config.prefix,
          maxKeys: poolSize,
          fileExtensions: config.extensions ? config.extensions.split(",").map((ext) => ext.trim()) : undefined,
          generatePresignedUrls: config.generatePresignedUrls,
          presignedUrlExpiry: config.presignedUrlExpiry,
        },
        credentialContext,
      );

      // Select files based on configuration
      let files = allFiles;
      if (allFiles.length > requestedFiles) {
        if (config.randomSelection) {
          // Fisher-Yates shuffle for random selection
          const shuffled = [...allFiles];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          files = shuffled.slice(0, requestedFiles);

          logger.info("Randomly selected files", {
            poolSize: allFiles.length,
            selectedCount: files.length,
            requestedCount: requestedFiles,
          });
        } else {
          // Take first N files (default behavior)
          files = allFiles.slice(0, requestedFiles);

          logger.info("Selected first N files", {
            poolSize: allFiles.length,
            selectedCount: files.length,
            requestedCount: requestedFiles,
          });
        }
      }

      // Transform S3 objects to our output format with universalId
      const transformedFiles = files.map((file: S3FileObject) => {
        // Create a shorter universal ID suitable for database storage
        // Using first 12 characters of hash (similar to git short hash)
        const fileIdentifier = `${file.key}|${file.size || 0}|${file.lastModified || new Date().toISOString()}`;
        const fullHash = createHash("sha256").update(fileIdentifier).digest("hex");
        const universalId = fullHash.substring(0, 12); // 12 chars is enough for uniqueness

        return {
          ...file,
          universalId, // Short ID for database storage
        };
      });

      logger.info("S3 file listing completed", {
        fileCount: transformedFiles.length,
      });

      // Return the result wrapped in __outputs
      return {
        __outputs: {
          files: transformedFiles,
          count: transformedFiles.length,
        },
      };
    } catch (error) {
      logger.error("S3 file listing failed", { error });
      throw error;
    }
  }

  /**
   * Build credential context from execution context
   */
  private buildCredentialContext(context: NodeExecutionContext) {
    return {
      credentials: context.credentials || {},
      nodeType: NODE_TYPE,
      workflowId: context.workflow?.id || "",
      executionId: context.executionId || "",
      nodeId: context.nodeId || "",
    };
  }
}
