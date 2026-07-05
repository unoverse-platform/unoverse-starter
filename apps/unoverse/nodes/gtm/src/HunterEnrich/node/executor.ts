import { type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { HunterEnrichConfig, HunterEnrichExecutorOutput } from "../util/types";
import { PromiseNode, createLogger } from "../../shared/platform";
import { hunterEnrich } from "../service/enrichService";

const NODE_TYPE = "HunterEnrich";

export class HunterEnrichExecutor extends PromiseNode<HunterEnrichConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: HunterEnrichConfig,
    context: NodeExecutionContext,
  ): Promise<HunterEnrichExecutorOutput> {
    const logger = createLogger("HunterEnrich");

    logger.info("Starting Hunter Enrichment", {
      type: config.type,
      email: config.email,
      domain: config.domain,
    });

    try {
      const result = await hunterEnrich(config, context);

      logger.info("Hunter Enrichment completed", {
        hasPerson: !!result.person,
        hasCompany: !!result.company,
      });

      return {
        __outputs: {
          person: result.person,
          company: result.company,
        },
      };
    } catch (error) {
      logger.error("Hunter Enrichment failed", { error });
      throw error;
    }
  }
}
