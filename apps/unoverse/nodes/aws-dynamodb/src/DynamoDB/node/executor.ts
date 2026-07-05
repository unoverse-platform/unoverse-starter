import { type NodeExecutionContext } from "@unoverse-platform/plugin-base";
import { DynamoDBConfig, DynamoDBOutput } from "../util/types";
import { putDynamoDBRecordService } from "../service/putRecord";
import { PromiseNode, createLogger } from "../../shared/platform";

const NODE_TYPE = "DynamoDB";

export class DynamoDBExecutor extends PromiseNode<DynamoDBConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: DynamoDBConfig,
    context: NodeExecutionContext
  ): Promise<DynamoDBOutput> {
    const logger = createLogger("DynamoDB");
    
    // Build credential context for service
    const credentialContext = this.buildCredentialContext(context);
    
    try {
      // Allow input signal to override config record
      const record = inputs.signal || config.record;
      
      if (!record) {
        throw new Error("No record data provided in config or input signal");
      }

      const result = await putDynamoDBRecordService(
        {
          ...config,
          record,
        },
        credentialContext.credentials?.awsCredential,
        logger
      );

      logger.info("DynamoDB execution completed", {
        tableName: config.tableName,
        success: result.success,
        itemId: result.itemId
      });

      return {
        __outputs: {
          success: result.success,
          itemId: result.itemId
        }
      };
    } catch (error: any) {
      logger.error("DynamoDB execution failed", {
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
