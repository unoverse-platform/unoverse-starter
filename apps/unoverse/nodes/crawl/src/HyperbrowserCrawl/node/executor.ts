import { type NodeExecutionContext } from "@unoverse-platform/plugin-base";
import { PromiseNode } from "../../shared/platform";
import { HyperbrowserCrawlConfig, HyperbrowserCrawlExecutorOutput } from "../util/types";
import { crawlSite } from "../service/crawlService";

const NODE_TYPE = "HyperbrowserCrawl";

export class HyperbrowserCrawlExecutor extends PromiseNode<HyperbrowserCrawlConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: HyperbrowserCrawlConfig,
    context: NodeExecutionContext
  ): Promise<HyperbrowserCrawlExecutorOutput> {
    const credentialContext = this.buildCredentialContext(context);

    const result = await crawlSite(config, credentialContext);

    return {
      __outputs: {
        pages: result.pages,
        links: result.links,
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
