import { PromiseNode, type NodeExecutionContext, type ValidationResult } from "@unoverse-platform/plugin-base";
import { searchPlaces, type SearchPlacesConfig } from "../service";

export default class SearchPlacesExecutor extends PromiseNode {
  constructor() {
    super("SearchPlaces");
  }

  protected async validateConfig(config: SearchPlacesConfig): Promise<ValidationResult> {
    if (!config.query?.trim()) {
      return { success: false, errors: ["Search query is required"] };
    }
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: SearchPlacesConfig,
    context: NodeExecutionContext
  ): Promise<any> {
    const credentialContext = this.buildCredentialContext(context);
    const result = await searchPlaces(config, context.api, credentialContext);

    return {
      __outputs: {
        placeResults: result.placeResults,
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
