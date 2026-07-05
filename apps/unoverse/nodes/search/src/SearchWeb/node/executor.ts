import { PromiseNode, type NodeExecutionContext, type ValidationResult } from "@gravity-platform/plugin-base";
import { searchWeb, type SearchWebConfig } from "../service";

export default class SearchWebExecutor extends PromiseNode {
  constructor() {
    super("SearchWeb");
  }

  protected async validateConfig(config: SearchWebConfig): Promise<ValidationResult> {
    if (!config.query?.trim()) {
      return { success: false, errors: ["Search query is required"] };
    }
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: SearchWebConfig,
    context: NodeExecutionContext
  ): Promise<any> {
    const credentialContext = this.buildCredentialContext(context);
    const result = await searchWeb(config, context.api, credentialContext);

    return {
      __outputs: {
        webResults: result.webResults,
        imageResults: result.imageResults,
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
