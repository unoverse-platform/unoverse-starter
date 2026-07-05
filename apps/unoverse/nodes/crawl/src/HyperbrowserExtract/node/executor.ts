import { type NodeExecutionContext } from "@unoverse-platform/plugin-base";
import { PromiseNode } from "../../shared/platform";
import { HyperbrowserExtractConfig, HyperbrowserExtractExecutorOutput } from "../util/types";
import { extractFromUrls } from "../service/extractService";

const NODE_TYPE = "HyperbrowserExtract";

export class HyperbrowserExtractExecutor extends PromiseNode<HyperbrowserExtractConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: HyperbrowserExtractConfig,
    context: NodeExecutionContext
  ): Promise<HyperbrowserExtractExecutorOutput> {
    const credentialContext = this.buildCredentialContext(context);

    const result = await extractFromUrls(config, credentialContext);

    return {
      __outputs: {
        data: result.data,
        metadata: result.metadata,
      },
    };
  }

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
