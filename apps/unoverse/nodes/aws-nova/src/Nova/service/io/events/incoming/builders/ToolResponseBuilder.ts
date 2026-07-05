/**
 * Tool response event builder for Nova Speech
 */

import { v4 as uuid } from "uuid";

/**
 * Ensure the tool-result JSON is a top-level OBJECT.
 * Bedrock Nova Sonic rejects arrays/primitives at the top level with
 * "Unsupported JSON type in Tool Result". If the MCP returned an array
 * or scalar, wrap it under `results`. Otherwise pass through unchanged —
 * same behaviour as ChatGPTAgent (which sends the raw result).
 */
function ensureJsonObject(toolResult: any): any {
  if (toolResult !== null && typeof toolResult === "object" && !Array.isArray(toolResult)) {
    return toolResult;
  }
  return { results: toolResult ?? null };
}

export interface ToolContentStartEvent {
  event: {
    contentStart: {
      promptName: string;
      contentName: string;
      interactive: boolean;
      type: "TOOL";
      role: "TOOL";
      toolResultInputConfiguration: {
        toolUseId: string;
        type: "TEXT";
        textInputConfiguration: {
          mediaType: string;
        };
      };
    };
  };
}

export interface ToolResultEvent {
  event: {
    toolResult: {
      promptName: string;
      contentName: string;
      content: string;
      status: "success" | "error";
    };
  };
}

/**
 * Builds tool response events for Nova Speech
 */
export class ToolResponseBuilder {
  /**
   * Creates tool content start event
   */
  static createContentStart(promptName: string, contentName: string, toolUseId: string): ToolContentStartEvent {
    const event = {
      event: {
        contentStart: {
          promptName,
          contentName,
          interactive: false,
          type: "TOOL" as const,
          role: "TOOL" as const,
          toolResultInputConfiguration: {
            toolUseId,
            type: "TEXT" as const,
            textInputConfiguration: {
              mediaType: "text/plain",
            },
          },
        },
      },
    };
    return event;
  }

  /**
   * Creates tool result event
   */
  static createToolResult(promptName: string, contentName: string, toolResult: any): ToolResultEvent {
    // Pass the raw MCP result through (same as ChatGPTAgent). Only guarantee
    // the top-level is a JSON object, since Bedrock rejects arrays/primitives.
    const objectResult = ensureJsonObject(toolResult);

    let content = JSON.stringify(objectResult);
    const MAX_TOOL_RESULT_LENGTH = 8000;
    const originalLength = content.length;

    if (originalLength > MAX_TOOL_RESULT_LENGTH) {
      // Don't slice mid-escape; substitute a safe truncation marker object so
      // Bedrock still sees valid JSON.
      content = JSON.stringify({
        truncated: true,
        originalLength,
        maxLength: MAX_TOOL_RESULT_LENGTH,
        preview: JSON.stringify(objectResult).substring(0, 500),
      });
      // eslint-disable-next-line no-console
      console.warn(
        `[ToolResponseBuilder] Tool result too large: ${originalLength} chars, sent truncated summary instead`,
      );
    }

    const event = {
      event: {
        toolResult: {
          promptName,
          contentName,
          content,
          status: "success" as const,
        },
      },
    };
    return event;
  }

  /**
   * Creates tool content end event
   */
  static createContentEnd(promptName: string, contentName: string): any {
    const event = {
      event: {
        contentEnd: {
          promptName,
          contentName,
        },
      },
    };
    return event;
  }

  /**
   * Creates all tool response events
   */
  static buildToolResponseEvents(promptName: string, toolUseId: string, toolResult: any): any[] {
    const contentName = uuid();

    return [
      this.createContentStart(promptName, contentName, toolUseId),
      this.createToolResult(promptName, contentName, toolResult),
      this.createContentEnd(promptName, contentName),
    ];
  }

  /**
   * Creates tool response events with custom content name
   */
  static buildToolResponseEventsWithContentName(
    promptName: string,
    contentName: string,
    toolUseId: string,
    toolResult: any,
  ): any[] {
    return [
      this.createContentStart(promptName, contentName, toolUseId),
      this.createToolResult(promptName, contentName, toolResult),
      this.createContentEnd(promptName, contentName),
    ];
  }
}
