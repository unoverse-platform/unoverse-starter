/**
 * OpenAI Structured Output Executor
 * PromiseNode that handles structured extraction via GPT-5 Responses API
 */

import { PromiseNode, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { extractStructuredOutput } from "../service/structuredOutput";
import { OpenAICredentials } from "../../OpenAI/util/types";

interface StructuredOutputConfig {
  model: string;
  instructions: string;
  schemaName: string;
}

export default class OpenAIStructuredOutputExecutor extends PromiseNode {
  constructor() {
    super("OpenAIStructuredOutput");
  }

  protected async validateConfig(config: StructuredOutputConfig): Promise<any> {
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: StructuredOutputConfig,
    context: NodeExecutionContext
  ): Promise<any> {
    const { content, schema } = inputs;

    if (!content) {
      throw new Error("Content input is required");
    }

    if (!schema) {
      throw new Error("Schema input is required");
    }

    // Get credentials
    let credentials: OpenAICredentials | undefined;
    const availableCredentials = context.credentials || {};

    for (const [name, cred] of Object.entries(availableCredentials)) {
      if ((cred as any)?.apiKey) {
        credentials = cred as OpenAICredentials;
        this.logger.debug?.(`Using credentials from: ${name}`);
        break;
      }
    }

    if (!credentials?.apiKey) {
      throw new Error("OpenAI API key not found in credentials");
    }

    // Build config for extraction
    const extractionConfig = {
      model: config.model || "gpt-5.1",
      instructions: config.instructions || "Extract structured information from the provided content.",
      schemaName: config.schemaName || "extraction",
    };

    // Build execution context for token tracking
    const executionContext = {
      workflowId: context.workflowId || context.workflow?.id || "",
      executionId: context.executionId,
      nodeId: context.nodeId,
      api: context.api,
    };

    // Call the service function
    return extractStructuredOutput(content, schema, extractionConfig, credentials, this.logger, executionContext);
  }
}
