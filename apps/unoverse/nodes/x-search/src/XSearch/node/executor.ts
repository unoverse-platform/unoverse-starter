import { PromiseNode, type NodeExecutionContext, type ValidationResult } from "@gravity-platform/plugin-base";
import { xSearchService, type XSearchConfig } from "../service";

export default class XSearchExecutor extends PromiseNode {
  constructor() {
    super("XSearch");
  }

  protected async validateConfig(config: XSearchConfig): Promise<ValidationResult> {
    if (!config.query?.trim()) {
      return { success: false, errors: ["Query is required"] };
    }
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: XSearchConfig,
    context: NodeExecutionContext
  ): Promise<any> {
    const credentialContext = this.buildCredentialContext(context);
    const creds = await context.api.getNodeCredentials(credentialContext, "xCredential");
    const bearerToken = creds?.bearerToken;

    if (!bearerToken) {
      throw new Error("X Bearer Token not configured");
    }

    const query = config.query || inputs?.query;
    const result = await xSearchService({ ...config, query }, bearerToken);

    return {
      __outputs: {
        tweets: result.tweets,
        resultCount: result.resultCount,
        raw: result.raw,
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
