import { PromiseNode, type NodeExecutionContext } from "@gravity-platform/plugin-base";

interface BedrockEmbeddingServiceConfig {
  model: string;
  normalize?: boolean;
  dimensions?: number;
  textTemplate?: string;
}

export default class BedrockEmbeddingServiceExecutor extends PromiseNode {
  constructor() {
    super("BedrockEmbeddingService");
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: BedrockEmbeddingServiceConfig,
    context: NodeExecutionContext
  ): Promise<any> {
    // Service nodes are invoked via the state machine signal system
    // The state machine will call handleServiceCall directly when SERVICE_CALL signals arrive
    throw new Error(
      "BedrockEmbeddingService is a service node - it should only be invoked via SERVICE_CALL signals through the state machine, not regular workflow execution"
    );
  }

  // This method will be called by the state machine when a SERVICE_CALL signal is received
  async handleServiceCall(method: string, params: any, config: any, context: NodeExecutionContext): Promise<any> {
    this.logger.info(`Handling SERVICE_CALL: ${method}`, {
      method,
      nodeId: context.nodeId,
      config,
      configKeys: Object.keys(config || {}),
      hasNestedConfig: !!config?.config,
      directDimensions: config?.dimensions,
      nestedDimensions: config?.config?.dimensions,
    });

    try {
      let result;

      // Check if config is nested or direct
      const actualConfig = config?.config ? config.config : config;

      switch (method) {
        case "createEmbedding": {
          const { createEmbedding } = await import("../service/createEmbedding");
          result = await createEmbedding(params, actualConfig, context);
          break;
        }
        case "createBatchEmbeddings": {
          const { createBatchEmbeddings } = await import("../service/createBatchEmbeddings");
          result = await createBatchEmbeddings(params, actualConfig, context);
          break;
        }
        default:
          throw new Error(
            `Unknown service method: ${method}. Available methods: createEmbedding, createBatchEmbeddings`
          );
      }

      this.logger.info(`SERVICE_CALL completed: ${method}`, {
        method,
        nodeId: context.nodeId,
      });

      return result;
    } catch (error) {
      this.logger.error(`SERVICE_CALL failed: ${method}`, {
        method,
        nodeId: context.nodeId,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}
