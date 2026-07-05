import { PromiseNode, type NodeExecutionContext } from "@unoverse-platform/plugin-base";
import { S3UploadConfig, S3UploadExecutorOutput } from "../util/types";
import { uploadToS3 } from "../service/s3UploadService";

const NODE_TYPE = "S3Upload";

export class S3UploadExecutor extends PromiseNode {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: S3UploadConfig,
    context: NodeExecutionContext
  ): Promise<S3UploadExecutorOutput> {
    const logger = context.api?.createLogger?.("S3Upload") || this.logger;

    logger.info("Starting S3 upload", {
      nodeId: context.nodeId,
      bucket: config.bucket,
      key: config.key,
    });

    // Get credentials
    const credentials = await context.api.getNodeCredentials(this.getExecutionContext(context), "awsCredential");

    try {
      const result = await uploadToS3(
        {
          bucket: config.bucket,
          key: config.key,
          sourceUrl: config.sourceUrl,
          base64Data: config.base64Data,
          contentType: config.contentType,
        },
        credentials
      );

      logger.info("S3 upload completed", {
        bucket: result.bucket,
        key: result.key,
        size: result.size,
        s3Url: result.s3Url,
      });

      return {
        __outputs: {
          output: result,
        },
      };
    } catch (error) {
      logger.error("S3 upload failed", {
        bucket: config.bucket,
        key: config.key,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
