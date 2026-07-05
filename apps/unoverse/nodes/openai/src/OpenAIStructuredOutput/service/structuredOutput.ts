/**
 * OpenAI Structured Output Service
 * Uses the OpenAI Responses API with JSON schema for structured extraction
 */

import { OpenAICredentials } from "../../OpenAI/util/types";

interface StructuredOutputConfig {
  model?: string;
  instructions?: string;
  schemaName?: string;
}

interface StructuredOutputResult {
  result: any;
  usage?: any;
}

/**
 * Extract structured data using OpenAI Responses API with JSON schema
 */
export async function extractStructuredOutput(
  content: string | { type: string; imageUrl: string; metadata?: any },
  schema: any,
  config: StructuredOutputConfig,
  credentials: OpenAICredentials,
  logger?: any,
  executionContext?: { workflowId: string; executionId: string; nodeId: string; api?: any }
): Promise<StructuredOutputResult> {
  const log = logger || console;

  if (!credentials?.apiKey) {
    throw new Error("OpenAI API key not found in credentials");
  }

  const apiKey = credentials.apiKey;
  const baseUrl = credentials.baseUrl || "https://api.openai.com/v1";

  // Build input content - handle both text and image content
  let inputContent: any;
  if (typeof content === "string") {
    // Text content
    inputContent = content;
  } else if (content.type === "image" && content.imageUrl) {
    // Image content - format for vision API
    inputContent = [
      { type: "input_image", image_url: content.imageUrl },
      {
        type: "input_text",
        text: `Analyze this image and extract structured information. Image metadata: ${JSON.stringify(
          content.metadata || {}
        )}`,
      },
    ];
  } else {
    // Fallback - stringify the object
    inputContent = JSON.stringify(content);
  }

  // Build Responses API request (GPT-5 Responses API)
  const requestBody = {
    model: config.model || "gpt-5.1",
    input: [{ role: "user", content: inputContent }],
    instructions: config.instructions || "Extract structured information from the provided content.",
    text: {
      format: {
        type: "json_schema",
        name: config.schemaName || "extraction",
        strict: true,
        schema: schema,
      },
      verbosity: "low",
    },
  };

  log.info?.("Calling OpenAI Responses API", {
    model: requestBody.model,
    schemaName: config.schemaName,
  });

  const response = await fetch(`${baseUrl}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    log.error?.("OpenAI Responses API error", { status: response.status, error });
    throw new Error(`OpenAI Responses API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as any;

  // Extract text from Responses API output
  let outputText = "";
  for (const outputItem of data.output || []) {
    if (outputItem.type === "message" && outputItem.content) {
      for (const contentItem of outputItem.content) {
        if (contentItem.type === "output_text") {
          outputText += contentItem.text;
        }
      }
    }
  }

  // Parse JSON output
  const parsed = JSON.parse(outputText);

  log.info?.("OpenAI Structured Output completed", {
    model: config.model,
    usage: data.usage,
  });

  // Save token usage if execution context provided
  if (executionContext && data.usage && executionContext.api?.saveTokenUsage) {
    await executionContext.api.saveTokenUsage({
      workflowId: executionContext.workflowId,
      executionId: executionContext.executionId,
      nodeId: executionContext.nodeId,
      nodeType: "OpenAIStructuredOutput",
      model: config.model || "gpt-5.1",
      usage: data.usage,
      timestamp: new Date(),
    });
    log.info?.(`Token usage saved: ${data.usage.total_tokens || 0} tokens`);
  }

  return {
    result: parsed,
    usage: data.usage,
  };
}
