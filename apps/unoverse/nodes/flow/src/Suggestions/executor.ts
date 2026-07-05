/**
 * Suggestions Node Executor
 * Publishes FAQs, Actions, and Recommendations to the client state via WebSocket
 */

import { NodeExecutionContext, ValidationResult } from "@gravity-platform/plugin-base";
import { PromiseNode } from "../shared/platform";

interface SuggestionsConfig {
  faqs?: Array<{ id?: string; question: string }>;
  actions?: Array<{
    object?: Record<string, any>;
    title?: string;
    description?: string;
    image?: string;
    callToAction?: string;
  }>;
  recommendations?: Array<{ id?: string; text: string; confidence?: number; actionLabel?: string }>;
}

interface Suggestions {
  // The shape the TEMPLATE picks up ({ text }). The producer owns its data shape; the SDK
  // stores it opaquely and knows no "faq" (UNOVERSE_STATE_MODEL §8). Config still authors
  // `{ question }` — we normalize to `{ text }` here, at the source.
  faqs: Array<{ text: string }>;
  actions: Array<{
    object?: Record<string, any>;
    title?: string;
    description?: string;
    image?: string;
    callToAction?: string;
  }>;
  recommendations: Array<{ id?: string; text: string; confidence?: number; actionLabel?: string }>;
}

export default class SuggestionsExecutor extends PromiseNode<SuggestionsConfig> {
  constructor() {
    super("Suggestions");
  }

  protected async validateConfig(config: SuggestionsConfig): Promise<ValidationResult> {
    // No required config - all optional
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: SuggestionsConfig,
    context: NodeExecutionContext
  ): Promise<any> {
    // Extract suggestions from signal input or config
    const signalData = this.extractSignalData(inputs);

    // Normalize faqs to the template's shape ({ text }) HERE, at the source. Accepts a
    // string, { text }, or { question } and emits { text } — so the SDK never has to.
    const rawFaqs = (signalData?.faqs || config.faqs || []) as Array<string | { text?: string; question?: string }>;
    const suggestions: Suggestions = {
      faqs: rawFaqs.map((f) => ({ text: typeof f === "string" ? f : (f?.text ?? f?.question ?? "") })),
      actions: signalData?.actions || config.actions || [],
      recommendations: signalData?.recommendations || config.recommendations || [],
    };

    this.logger.info("📤 Suggestions node executing", {
      nodeId: context.nodeId,
      faqCount: suggestions.faqs.length,
      actionCount: suggestions.actions.length,
      recommendationCount: suggestions.recommendations.length,
    });

    // Get publishing context
    if (!context.publishingContext) {
      this.logger.warn("Publishing context not available - suggestions not sent to client");
      return { __outputs: { suggestions } };
    }

    // Publish to client via WebSocket
    try {
      const api = context.api;
      const wsManager = api?.getWebSocketManager?.();

      if (wsManager) {
        const websocket = wsManager.get(context.publishingContext.userId, context.publishingContext.conversationId);

        if (websocket) {
          // Generic write into TEMPLATE STATE (UNOVERSE_STATE_MODEL §2): the producer names
          // the keys (`faqs`/`actions`/`recommendations`); the SDK merges `data` opaquely and
          // the template fragment picks `faqs` up. send() fans out to BOTH the new /stream
          // (TEMPLATE_DATA, handled) and the legacy WS — legacy consumers that expected
          // SUGGESTIONS_UPDATE no longer get it (intended migration break).
          const wsMessage = {
            type: "TEMPLATE_DATA",
            chatId: context.publishingContext.chatId,
            conversationId: context.publishingContext.conversationId,
            userId: context.publishingContext.userId,
            workflowId: context.workflowId,
            workflowRunId: context.executionId,
            data: suggestions,
            timestamp: new Date().toISOString(),
          };

          websocket.send(JSON.stringify(wsMessage));

          this.logger.info("✅ Suggestions sent to client", {
            nodeId: context.nodeId,
            userId: context.publishingContext.userId,
          });
        } else {
          this.logger.debug("No WebSocket connection found for suggestions");
        }
      } else {
        this.logger.debug("WebSocket manager not available");
      }
    } catch (error: any) {
      this.logger.warn("Failed to publish suggestions (non-blocking)", {
        error: error.message,
      });
    }

    return {
      __outputs: {
        suggestions,
      },
    };
  }

  /**
   * Extract suggestions data from signal input
   */
  private extractSignalData(inputs: Record<string, any>): Partial<Suggestions> | null {
    if (!inputs.signal) return null;

    // Handle direct object
    if (typeof inputs.signal === "object" && !Array.isArray(inputs.signal)) {
      // Check if it has suggestions properties directly
      if (inputs.signal.faqs || inputs.signal.actions || inputs.signal.recommendations) {
        return inputs.signal;
      }

      // Handle nested structure from signal routing
      // e.g., { signal: { sourceNode: { outputHandle: { faqs: [...] } } } }
      const sourceNodes = Object.keys(inputs.signal);
      if (sourceNodes.length > 0) {
        const sourceData = inputs.signal[sourceNodes[0]];
        if (typeof sourceData === "object") {
          // Check for direct properties
          if (sourceData.faqs || sourceData.actions || sourceData.recommendations) {
            return sourceData;
          }
          // Check nested output handle
          const handles = Object.keys(sourceData);
          if (handles.length > 0) {
            const handleData = sourceData[handles[0]];
            if (handleData?.faqs || handleData?.actions || handleData?.recommendations) {
              return handleData;
            }
          }
        }
      }
    }

    return null;
  }
}

export { SuggestionsExecutor };
