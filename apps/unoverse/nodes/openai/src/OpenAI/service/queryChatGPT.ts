/**
 * OpenAI completion service
 * Handles all OpenAI API interactions with proper credential management
 */

import OpenAI from "openai";
import {
  OpenAIConfig,
  OpenAIMessage,
  OpenAICompletionRequest,
  OpenAICompletionResponse,
  OpenAICredentials,
} from "../util/types";

type CredentialContext = any;

/**
 * Generate a completion using OpenAI's chat API
 */
export async function queryChatGPT(
  config: OpenAIConfig,
  context: CredentialContext,
  api: any,
  executionContext?: { workflowId: string; executionId: string; nodeId: string }
): Promise<{ text: string; usage?: any }> {
  const log = api?.createLogger?.("OpenAI") || console;

  try {
    // Get credentials from context.credentials
    // The key name comes from the node definition and is already resolved by the platform
    let credentials: OpenAICredentials | undefined;
    const availableCredentials = context.credentials || {};

    // Find credential with apiKey signature (OpenAI credentials have apiKey)
    for (const [name, cred] of Object.entries(availableCredentials)) {
      if ((cred as any)?.apiKey) {
        credentials = cred as OpenAICredentials;
        log.debug?.(`Using credentials from: ${name}`);
        break;
      }
    }

    if (!credentials?.apiKey) {
      throw new Error("OpenAI API key not found in credentials");
    }

    const apiKey = credentials.apiKey;
    const organizationId = credentials.organizationId;
    const baseUrl = credentials.baseUrl || "https://api.openai.com/v1";

    // Build messages array
    const messages: OpenAIMessage[] = [];

    if (config.systemPrompt) {
      messages.push({
        role: "system",
        content: config.systemPrompt,
      });
    }

    // Add conversation history if provided
    if (config.history && Array.isArray(config.history)) {
      messages.push(...config.history);
    }

    // Add the current prompt as the final user message
    messages.push({
      role: "user",
      content: config.prompt,
    });

    // Build request - GPT-5 uses max_completion_tokens instead of max_tokens
    const isGPT5 = config.model?.startsWith("gpt-5");
    const requestBody: OpenAICompletionRequest = {
      model: config.model,
      messages,
      temperature: config.temperature,
      ...(isGPT5 ? { max_completion_tokens: config.maxTokens } : { max_tokens: config.maxTokens }),
    };

    log.info("Calling OpenAI API", {
      model: config.model,
      messageCount: messages.length,
      maxTokens: config.maxTokens,
    });

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey,
      baseURL: baseUrl,
      ...(organizationId && { organization: organizationId }),
    });

    // Make API call using the OpenAI library
    const response = await openai.chat.completions.create(requestBody);

    const data = response as OpenAICompletionResponse;

    const generatedText = data.choices[0]?.message?.content || "";

    log.info("OpenAI completion successful", {
      model: config.model,
      usage: data.usage,
      textLength: generatedText.length,
    });

    // Save token usage if execution context provided
    if (executionContext && data.usage && api?.saveTokenUsage) {
      await api.saveTokenUsage({
        workflowId: executionContext.workflowId,
        executionId: executionContext.executionId,
        nodeId: executionContext.nodeId,
        nodeType: "OpenAI",
        model: config.model,
        usage: data.usage, // Pass entire usage object
        timestamp: new Date(),
      });
      log.info(`Token usage saved: ${data.usage.total_tokens} tokens for model ${config.model}`);
    }

    return {
      text: generatedText,
      usage: data.usage,
    };
  } catch (error: any) {
    log.error("Failed to generate completion", { error });
    throw new Error(`Failed to generate completion: ${error.message}`);
  }
}
