import { getPlatformDependencies, type NodeExecutionContext } from "@unoverse-platform/plugin-base";
import { S3FileContentConfig, S3FileContentExecutorOutput } from "../util/types";
import { getS3FileContent } from "../service/s3FileContentService";

// Get platform dependencies
const { PromiseNode, createLogger } = getPlatformDependencies();

const NODE_TYPE = "S3FileContent";

export default class S3FileContentExecutor extends PromiseNode<S3FileContentConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: S3FileContentConfig,
    context: NodeExecutionContext
  ): Promise<S3FileContentExecutorOutput> {
    const logger = createLogger("S3FileContent");
    
    // Build credential context for service
    const credentialContext = this.buildCredentialContext(context);

    // Get file from config - ALL data comes through config (template-resolved)
    const file = config.file;

    logger.info(`S3FileContent config.file resolved to:`, {
      fileKey: file?.key,
      universalId: file?.universalId,
      bucket: file?.bucket,
    });

    if (!file || typeof file !== "object") {
      throw new Error("No file input received. Connect this node to a Loop node or provide a file object.");
    }

    // Determine bucket - from config override or file metadata
    const bucket = config.bucket || file.bucket;
    if (!bucket) {
      throw new Error(
        `No bucket specified for file ${file.key}. Set bucket in node config or ensure upstream node provides it.`
      );
    }

    logger.info("Fetching S3 file content", {
      bucket,
      key: file.key,
      size: file.size,
    });

    try {
      // Fetch file content using service
      const fileContent = await getS3FileContent(bucket, file.key, credentialContext, file);

      logger.info("S3 file content fetched successfully", {
        key: file.key,
        size: fileContent.size,
        downloadUrlGenerated: !!fileContent.downloadUrl,
      });

      return {
        __outputs: {
          fileContent,
        },
      };
    } catch (error) {
      logger.error(`Failed to fetch S3 file content for ${file.key}`, {
        error,
        bucket,
        key: file.key,
      });

      throw new Error(
        `Failed to fetch S3 file content for ${file.key}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
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
