/**
 * Cloudinary Upload Node Executor
 * Handles uploading images to Cloudinary
 */

import { getPlatformDependencies, type NodeExecutionContext, type ValidationResult } from "@gravity-platform/plugin-base";
import { uploadImage } from "../service/uploadImage";
import { CloudinaryUploadConfig, CloudinaryUploadOutput } from "../util/types";

const { PromiseNode } = getPlatformDependencies();

export class CloudinaryUploadExecutor extends PromiseNode<CloudinaryUploadConfig> {
  constructor() {
    super("CloudinaryUpload");
  }

  protected async validateConfig(config: CloudinaryUploadConfig): Promise<ValidationResult> {
    if (!config.imageData || config.imageData.trim() === "") {
      return {
        success: false,
        error: "Image data is required (base64 or URL)",
      };
    }

    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: CloudinaryUploadConfig,
    context: NodeExecutionContext
  ): Promise<CloudinaryUploadOutput> {
    // Build credential context
    const credentialContext = this.buildCredentialContext(context);

    // Upload image
    const result = await uploadImage(config, credentialContext, this.logger);

    return {
      __outputs: {
        url: result.url,
        secureUrl: result.secureUrl,
        publicId: result.publicId,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        metadata: {
          uploadedAt: result.createdAt,
          folder: config.folder,
          tags: result.tags,
        },
      },
    };
  }

  /**
   * Build credential context from execution context
   */
  private buildCredentialContext(context: NodeExecutionContext) {
    const { workflowId, executionId, nodeId } = this.validateAndGetContext(context);

    return {
      workflowId,
      executionId,
      nodeId,
      nodeType: this.nodeType,
      config: context.config,
      credentials: context.credentials || {},
    };
  }
}
