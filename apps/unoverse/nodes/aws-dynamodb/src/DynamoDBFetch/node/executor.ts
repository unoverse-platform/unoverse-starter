import { type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { DynamoDBFetchConfig, DynamoDBFetchOutput } from "../util/types";
import { fetchDynamoDBRecordService } from "../service/fetchRecord";
import { PromiseNode, createLogger } from "../../shared/platform";

const NODE_TYPE = "DynamoDBFetch";

export class DynamoDBFetchExecutor extends PromiseNode<DynamoDBFetchConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: DynamoDBFetchConfig,
    context: NodeExecutionContext
  ): Promise<DynamoDBFetchOutput> {
    const logger = createLogger("DynamoDBFetch");
    
    // Build credential context for service
    const credentialContext = this.buildCredentialContext(context);
    
    try {
      const result = await fetchDynamoDBRecordService(
        config,
        inputs,
        credentialContext.credentials?.awsCredential,
        logger
      );

      logger.info("DynamoDBFetch execution completed", {
        tableName: config.tableName,
        found: result.found,
        primaryKey: config.primaryKey
      });

      return {
        __outputs: {
          output: result.document || null,
          found: result.found
        }
      };
    } catch (error: any) {
      logger.error("DynamoDBFetch execution failed", {
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
