import { type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { CloudinaryFilesConfig, CloudinaryFilesOutput } from "../util/types";
import { listCloudinaryFiles } from "../service/listFiles";
import { PromiseNode, createLogger } from "../../shared/platform";
const NODE_TYPE = "CloudinaryFiles";

export class CloudinaryFilesExecutor extends PromiseNode<CloudinaryFilesConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: CloudinaryFilesConfig,
    context: NodeExecutionContext
  ): Promise<CloudinaryFilesOutput> {
    const logger = createLogger("CloudinaryFiles");
    
    // Build credential context for service
    const credentialContext = this.buildCredentialContext(context);
    
    try {
      const result = await listCloudinaryFiles(
        config,
        credentialContext.credentials?.cloudinaryCredential,
        logger
      );

      logger.info("CloudinaryFiles execution completed", {
        filesFound: result.count,
        folder: config.folder,
        resourceType: config.resourceType
      });

      return {
        __outputs: {
          files: result.files,
          count: result.count
        }
      };
    } catch (error: any) {
      logger.error("CloudinaryFiles execution failed", {
        error: error.message,
        code: error.code,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Build credential context from execution context
   */
  private buildCredentialContext(context: NodeExecutionContext) {
    return {
      credentials: {
        cloudinaryCredential: context.credentials?.cloudinaryCredential || {},
      },
      nodeType: NODE_TYPE,
      workflowId: context.workflow?.id || "",
      executionId: context.executionId || "",
      nodeId: context.nodeId || "",
    };
  }
}
