import { type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { HunterDiscoverConfig, HunterDiscoverExecutorOutput } from "../util/types";
import { PromiseNode, createLogger } from "../../shared/platform";
import { hunterDiscover } from "../service/discoverService";

const NODE_TYPE = "HunterDiscover";

export class HunterDiscoverExecutor extends PromiseNode<HunterDiscoverConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: HunterDiscoverConfig,
    context: NodeExecutionContext,
  ): Promise<HunterDiscoverExecutorOutput> {
    const logger = createLogger("HunterDiscover");

    logger.info("Starting Hunter Discover", { limit: config.limit });

    try {
      const result = await hunterDiscover(config, context);

      logger.info("Hunter Discover completed", {
        companies: result.companies.length,
        totalResults: result.totalResults,
      });

      return {
        __outputs: {
          companies: result.companies,
          totalResults: result.totalResults,
          limit: result.limit,
          offset: result.offset,
        },
      };
    } catch (error) {
      logger.error("Hunter Discover failed", { error });
      throw error;
    }
  }
}
