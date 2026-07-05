import { PromiseNode, type NodeExecutionContext, type ValidationResult } from "@gravity-platform/plugin-base";
import { searchNews, type SearchNewsConfig } from "../service";

export default class SearchNewsExecutor extends PromiseNode {
  constructor() {
    super("SearchNews");
  }

  protected async validateConfig(config: SearchNewsConfig): Promise<ValidationResult> {
    if (!config.query?.trim()) {
      return { success: false, errors: ["Search query is required"] };
    }
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: SearchNewsConfig,
    context: NodeExecutionContext
  ): Promise<any> {
    const credentialContext = this.buildCredentialContext(context);
    const result = await searchNews(config, context.api, credentialContext);

    return {
      __outputs: {
        newsResults: result.newsResults,
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
