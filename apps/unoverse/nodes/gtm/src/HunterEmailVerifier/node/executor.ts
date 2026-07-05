import { type NodeExecutionContext } from "@unoverse-platform/plugin-base";
import { HunterEmailVerifierConfig, HunterEmailVerifierExecutorOutput } from "../util/types";
import { PromiseNode, createLogger } from "../../shared/platform";
import { hunterEmailVerifier } from "../service/emailVerifierService";

const NODE_TYPE = "HunterEmailVerifier";

export class HunterEmailVerifierExecutor extends PromiseNode<HunterEmailVerifierConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: HunterEmailVerifierConfig,
    context: NodeExecutionContext,
  ): Promise<HunterEmailVerifierExecutorOutput> {
    const logger = createLogger("HunterEmailVerifier");

    logger.info("Starting Hunter Email Verifier", { email: config.email });

    try {
      const result = await hunterEmailVerifier(config, context);

      logger.info("Hunter Email Verifier completed", {
        email: result.email,
        status: result.status,
        result: result.result,
      });

      return {
        __outputs: {
          email: result.email,
          status: result.status,
          result: result.result,
          score: result.score,
          regexp: result.regexp,
          gibberish: result.gibberish,
          disposable: result.disposable,
          webmail: result.webmail,
          mx_records: result.mx_records,
          smtp_server: result.smtp_server,
          smtp_check: result.smtp_check,
          accept_all: result.accept_all,
          block: result.block,
        },
      };
    } catch (error) {
      logger.error("Hunter Email Verifier failed", { error });
      throw error;
    }
  }
}
