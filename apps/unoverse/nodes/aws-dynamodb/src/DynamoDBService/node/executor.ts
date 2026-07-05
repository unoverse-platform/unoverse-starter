import { type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { DynamoDBServiceConfig, DynamoDBServiceOutput } from "../util/types";
import { PromiseNode, createLogger } from "../../shared/platform";
import { initializeDynamoDBClient } from "../../shared/client";

const NODE_TYPE = "DynamoDBService";

export class DynamoDBServiceExecutor extends PromiseNode<DynamoDBServiceConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: DynamoDBServiceConfig,
    context: NodeExecutionContext
  ): Promise<DynamoDBServiceOutput> {
    const logger = createLogger("DynamoDBService");
    
    // Build credential context for service
    const credentialContext = this.buildCredentialContext(context);
    
    try {
      // Initialize DynamoDB client to validate credentials
      const client = initializeDynamoDBClient(
        credentialContext.credentials?.awsCredential,
        logger
      );

      logger.info("DynamoDBService initialized successfully", {
        region: config.region || credentialContext.credentials?.awsCredential?.region,
        defaultTable: config.defaultTable
      });

      // Service nodes don't return data directly
      return {
        __outputs: {}
      };
    } catch (error: any) {
      logger.error("DynamoDBService initialization failed", {
        error: error.message,
        code: error.code,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Build credential context from execution context
   */
  private buildCredentialContext(context: NodeExecutionContext) {
    return {
      credentials: {
        awsCredential: context.credentials?.awsCredential || {},
      },
      nodeType: NODE_TYPE,
      workflowId: context.workflow?.id || "",
      executionId: context.executionId || "",
      nodeId: context.nodeId || "",
    };
  }
}
