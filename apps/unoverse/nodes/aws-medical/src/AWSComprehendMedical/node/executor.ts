import { type NodeExecutionContext } from "@unoverse-platform/plugin-base";
import { AWSComprehendMedicalConfig, AWSComprehendMedicalOutput } from "../util/types";
import { processComprehendMedicalText } from "../service/processText";
import { PromiseNode, createLogger } from "../../shared/platform";

const NODE_TYPE = "AWSComprehendMedical";

export class AWSComprehendMedicalExecutor extends PromiseNode<AWSComprehendMedicalConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: AWSComprehendMedicalConfig,
    context: NodeExecutionContext
  ): Promise<AWSComprehendMedicalOutput> {
    const logger = createLogger("AWSComprehendMedical");
    
    // Build credential context for service
    const credentialContext = this.buildCredentialContext(context);
    
    try {
      // Use input text if provided, otherwise use config text
      const textToAnalyze = inputs.text || config.text;
      
      if (!textToAnalyze || textToAnalyze.trim().length === 0) {
        throw new Error("No clinical text provided for analysis");
      }

      const result = await processComprehendMedicalText(
        {
          ...config,
          text: textToAnalyze,
        },
        credentialContext.credentials?.awsCredential,
        logger
      );

      logger.info("AWSComprehendMedical execution completed", {
        analysisType: config.analysisType,
        outputFormat: config.outputFormat,
        textLength: textToAnalyze.length,
        entityCount: result.metadata.entityCount,
        phiCount: result.metadata.phiCount,
        processingTime: result.metadata.processingTime
      });

      return {
        __outputs: {
          result,
          outputKey: result.outputKey
        }
      };
    } catch (error: any) {
      logger.error("AWSComprehendMedical execution failed", {
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
