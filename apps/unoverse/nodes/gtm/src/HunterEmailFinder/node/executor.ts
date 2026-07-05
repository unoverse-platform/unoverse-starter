import { type NodeExecutionContext } from "@unoverse-platform/plugin-base";
import { HunterEmailFinderConfig, HunterEmailFinderExecutorOutput } from "../util/types";
import { PromiseNode, createLogger } from "../../shared/platform";
import { hunterEmailFinder } from "../service/emailFinderService";

const NODE_TYPE = "HunterEmailFinder";

export class HunterEmailFinderExecutor extends PromiseNode<HunterEmailFinderConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: HunterEmailFinderConfig,
    context: NodeExecutionContext,
  ): Promise<HunterEmailFinderExecutorOutput> {
    const logger = createLogger("HunterEmailFinder");

    logger.info("Starting Hunter Email Finder", {
      domain: config.domain,
      company: config.company,
    });

    try {
      const result = await hunterEmailFinder(config, context);

      logger.info("Hunter Email Finder completed", {
        email: result.email,
        score: result.score,
      });

      return {
        __outputs: {
          email: result.email,
          score: result.score,
          first_name: result.first_name,
          last_name: result.last_name,
          position: result.position,
          domain: result.domain,
          company: result.company,
          twitter: result.twitter,
          linkedin_url: result.linkedin_url,
          phone_number: result.phone_number,
          accept_all: result.accept_all,
          verification_status: result.verification_status,
          sources_count: result.sources_count,
        },
      };
    } catch (error) {
      logger.error("Hunter Email Finder failed", { error });
      throw error;
    }
  }
}
