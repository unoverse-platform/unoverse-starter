import { PromiseNode, type NodeExecutionContext, type ValidationResult } from "@unoverse-platform/plugin-base";
import { searchVideos, type SearchVideosConfig } from "../service";

export default class SearchVideosExecutor extends PromiseNode {
  constructor() {
    super("SearchVideos");
  }

  protected async validateConfig(config: SearchVideosConfig): Promise<ValidationResult> {
    if (!config.query?.trim()) {
      return { success: false, errors: ["Search query is required"] };
    }
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: SearchVideosConfig,
    context: NodeExecutionContext
  ): Promise<any> {
    const credentialContext = this.buildCredentialContext(context);
    const result = await searchVideos(config, context.api, credentialContext);

    return {
      __outputs: {
        videoResults: result.videoResults,
      },
    };
  }

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
