import { type NodeExecutionContext } from "@unoverse-platform/plugin-base";
import { PromiseNode } from "../../shared/platform";
import { HyperbrowserScrapeConfig, HyperbrowserScrapeExecutorOutput } from "../util/types";
import { scrapeUrl } from "../service/scrapeService";

const NODE_TYPE = "HyperbrowserScrape";

export class HyperbrowserScrapeExecutor extends PromiseNode<HyperbrowserScrapeConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: HyperbrowserScrapeConfig,
    context: NodeExecutionContext
  ): Promise<HyperbrowserScrapeExecutorOutput> {
    const credentialContext = this.buildCredentialContext(context);

    const result = await scrapeUrl(config, credentialContext);

    return {
      __outputs: {
        markdown: result.markdown,
        html: result.html,
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
