/**
 * PineconeService Node Executor
 * Service node that provides vector database operations
 */

import { getPlatformDependencies, type NodeExecutionContext } from "@unoverse-platform/plugin-base";
import { PineconeServiceConfig, ServiceCallParams } from "../util/types";
import { handleServiceCall } from "../service/serviceHandler";

// Get platform dependencies - CRITICAL: Use Pattern A to avoid instanceof errors
const { PromiseNode, createLogger } = getPlatformDependencies();

const NODE_TYPE = "PineconeService";

export default class PineconeServiceExecutor extends PromiseNode<PineconeServiceConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    input: any,
    config: PineconeServiceConfig,
    context: NodeExecutionContext
  ): Promise<any> {
    // Service nodes should only handle SERVICE_CALL signals
    throw new Error(
      "PineconeService is a service node and should not be executed directly. " +
      "It should only handle SERVICE_CALL signals."
    );
  }

  async handleServiceCall(
    method: string,
    params: ServiceCallParams,
    config: any,
    context: NodeExecutionContext
  ): Promise<any> {
    return await handleServiceCall(method, params, config, context);
  }
}
