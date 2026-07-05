import { type NodeExecutionContext, type ValidationResult } from "@unoverse-platform/plugin-base";
import { PlaidTransactionsConfig, PlaidTransactionsOutput } from "../util/types";
import { PromiseNode, createLogger } from "../../shared/platform";
import { getPlaidTransactions } from "../service/plaidService";

const NODE_TYPE = "PlaidTransactions";
const CACHE_PREFIX = "plaid:transactions:";

export class PlaidTransactionsExecutor extends PromiseNode<PlaidTransactionsConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async validateConfig(config: PlaidTransactionsConfig): Promise<ValidationResult> {
    // Validation is minimal - defaults handle most cases
    if (config.daysBack !== undefined && (config.daysBack < 1 || config.daysBack > 730)) {
      return {
        success: false,
        error: "daysBack must be between 1 and 730",
      };
    }

    if (config.maxTransactions !== undefined && (config.maxTransactions < 1 || config.maxTransactions > 500)) {
      return {
        success: false,
        error: "maxTransactions must be between 1 and 500",
      };
    }

    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: PlaidTransactionsConfig,
    context: NodeExecutionContext
  ): Promise<PlaidTransactionsOutput> {
    const logger = createLogger("PlaidTransactions");
    const startTime = Date.now();

    const useCache = config.useCache !== false; // Default true
    const cacheTTLMinutes = config.cacheTTLMinutes || 60;
    const workflowId = context.workflow?.id || context.workflowId || "unknown";

    logger.info(`🏦 [PlaidTransactions] Starting transaction fetch`, {
      nodeId: context.nodeId,
      testUsername: config.testUsername || "user_transactions_dynamic",
      institutionId: config.institutionId || "ins_109508",
      daysBack: config.daysBack || 30,
      maxTransactions: config.maxTransactions || 100,
      useCache,
      cacheTTLMinutes,
      workflowId,
    });

    // Build cache key scoped to workflow
    const cacheKey = `${CACHE_PREFIX}${workflowId}:${config.testUsername || "user_transactions_dynamic"}:${
      config.institutionId || "ins_109508"
    }:${config.daysBack || 30}`;

    try {
      // Check Redis cache first if enabled
      if (useCache && (context as any).api?.getRedisClient) {
        const redis = (context as any).api.getRedisClient();
        const cached = await redis.get(cacheKey);

        if (cached) {
          const parsedCache = JSON.parse(cached);
          logger.info(`🏦 [PlaidTransactions] Cache HIT - returning cached transactions`, {
            nodeId: context.nodeId,
            cacheKey,
            transactionCount: parsedCache.transactions?.length || 0,
            duration: `${Date.now() - startTime}ms`,
          });

          return {
            __outputs: {
              transactions: parsedCache.transactions,
              accounts: parsedCache.accounts,
              totalTransactions: parsedCache.totalTransactions,
              startDate: parsedCache.startDate,
              endDate: parsedCache.endDate,
            },
          };
        }

        logger.info(`🏦 [PlaidTransactions] Cache MISS - fetching from Plaid`, {
          nodeId: context.nodeId,
          cacheKey,
        });
      }

      // Build credential context
      const credentialContext = this.buildCredentialContext(context);

      // Fetch transactions from Plaid
      const result = await getPlaidTransactions(config, credentialContext);

      // Store in Redis cache if enabled
      if (useCache && (context as any).api?.getRedisClient) {
        const redis = (context as any).api.getRedisClient();
        const cacheTTLSeconds = cacheTTLMinutes * 60;

        await redis.setex(
          cacheKey,
          cacheTTLSeconds,
          JSON.stringify({
            transactions: result.transactions,
            accounts: result.accounts,
            totalTransactions: result.totalTransactions,
            startDate: result.startDate,
            endDate: result.endDate,
            cachedAt: Date.now(),
          })
        );

        logger.info(`🏦 [PlaidTransactions] Cached transactions in Redis`, {
          nodeId: context.nodeId,
          cacheKey,
          ttlMinutes: cacheTTLMinutes,
        });
      }

      logger.info(`🏦 [PlaidTransactions] Fetch complete`, {
        nodeId: context.nodeId,
        transactionCount: result.transactions.length,
        accountCount: result.accounts.length,
        totalTransactions: result.totalTransactions,
        duration: `${Date.now() - startTime}ms`,
      });

      return {
        __outputs: {
          transactions: result.transactions,
          accounts: result.accounts,
          totalTransactions: result.totalTransactions,
          startDate: result.startDate,
          endDate: result.endDate,
        },
      };
    } catch (error: any) {
      logger.error(`🏦 [PlaidTransactions] Fetch failed`, {
        nodeId: context.nodeId,
        error: error.message,
        duration: `${Date.now() - startTime}ms`,
      });

      return {
        __outputs: {
          transactions: [],
          accounts: [],
          totalTransactions: 0,
          startDate: "",
          endDate: "",
          error: error.message,
        },
      };
    }
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
