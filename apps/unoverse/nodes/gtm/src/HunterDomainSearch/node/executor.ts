import { type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { HunterDomainSearchConfig, HunterDomainSearchExecutorOutput } from "../util/types";
import { PromiseNode, createLogger } from "../../shared/platform";
import { hunterDomainSearch } from "../service/domainSearchService";

const NODE_TYPE = "HunterDomainSearch";

export class HunterDomainSearchExecutor extends PromiseNode<HunterDomainSearchConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: HunterDomainSearchConfig,
    context: NodeExecutionContext,
  ): Promise<HunterDomainSearchExecutorOutput> {
    const logger = createLogger("HunterDomainSearch");

    logger.info("Starting Hunter Domain Search", {
      domain: config.domain,
      company: config.company,
      limit: config.limit,
    });

    try {
      const results = await hunterDomainSearch(config, context);

      logger.info("Hunter Domain Search completed", {
        emails: results.emails.length,
        totalResults: results.totalResults,
      });

      return {
        __outputs: {
          emails: results.emails,
          organization: results.organization,
          pattern: results.pattern,
          totalResults: results.totalResults,
          limit: results.limit,
          offset: results.offset,
        },
      };
    } catch (error) {
      logger.error("Hunter Domain Search failed", { error });
      throw error;
    }
  }
}
