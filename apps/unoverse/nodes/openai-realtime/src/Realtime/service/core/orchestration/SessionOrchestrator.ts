import { getPlatformDependencies } from "@unoverse-platform/plugin-base";
import { OpenAIRealtimeConfig, StreamUsageStats, StreamingMetadata } from "../../../../util/types";
import { WsClient } from "../streaming/WsClient";
import { SessionManager } from "../streaming/SessionManager";
import { RealtimeResponseProcessor } from "../processing/ResponseProcessor";
import { realtimeSessionRegistry } from "../streaming/RealtimeSessionRegistry";
import { SessionUpdateBuilder } from "../../io/events/incoming/builders/SessionUpdateBuilder";
import { ConversationItemBuilder } from "../../io/events/incoming/builders/ConversationItemBuilder";
import { ResponseCreateBuilder } from "../../io/events/incoming/builders/ResponseCreateBuilder";
import { RealtimeWebSocketAudioSubscriber } from "../../io/websocket/RealtimeWebSocketAudioSubscriber";
import { WebSocketAudioPublisher } from "../../io/publishers/WebSocketAudioPublisher";
import { REALTIME_MODEL_ID } from "../../../constants";

function getLogger() {
  return getPlatformDependencies().createLogger("RealtimeSessionOrchestrator");
}

const EMPTY_STATS: StreamUsageStats = {
  estimated: true,
  total_tokens: 0,
  inputTokens: 0,
  outputTokens: 0,
  chunk_count: 0,
  textOutput: "",
  transcription: "",
  assistantResponse: "",
};

export class SessionOrchestrator {
  private readonly logger = getLogger();
  private sessionManager = new SessionManager();

  async orchestrateSession(
    config: OpenAIRealtimeConfig,
    metadata: StreamingMetadata,
    context: any,
    emit?: (output: any) => void,
  ): Promise<StreamUsageStats> {
    const controlSignal = config.controlSignal ?? "START_CALL";
    const conversationId = metadata.conversationId || metadata.workflowId || "unknown";

    if (controlSignal === "END_CALL") {
      return this.handleEndCall(conversationId);
    }

    return this.handleStartCall(config, metadata, context, emit, conversationId);
  }

  private async handleStartCall(
    config: OpenAIRealtimeConfig,
    metadata: StreamingMetadata,
    context: any,
    emit: ((output: any) => void) | undefined,
    conversationId: string,
  ): Promise<StreamUsageStats> {
    // MCP discovery (timeout after 3s to avoid blocking session startup)
    const api = context?.api;
    if (api?.callService) {
      let discoveryTimer: NodeJS.Timeout | undefined;
      try {
        const discovery = api.callService("getSchema", {}, context);
        // If the timeout wins the race, a later rejection from the discovery call
        // must not surface as an unhandled rejection
        discovery.catch(() => {});
        const mcpSchema = await Promise.race([
          discovery,
          new Promise((_, reject) => {
            discoveryTimer = setTimeout(() => reject(new Error("MCP discovery timeout")), 3000);
          }),
        ]) as any;
        if (mcpSchema?.methods) {
          config.tools = Object.entries(mcpSchema.methods).map(([name, m]: [string, any]) => ({
            type: "function" as const,
            name,
            description: m.description ?? `Execute ${name}`,
            parameters: m.input ?? { type: "object", properties: {} },
          }));
          config.mcpService = {};
          for (const [methodName] of Object.entries(mcpSchema.methods)) {
            config.mcpService[methodName] = (input: any) => api.callService(methodName, input, context);
          }
          this.logger.info(`MCP tools configured: ${config.tools.length}`);
        }
      } catch {
        // No MCP connected — continue
      } finally {
        if (discoveryTimer) clearTimeout(discoveryTimer);
      }
    }

    // Credentials - using field signature pattern
    const credentials = this.getCredentials(context);

    const wsClient = new WsClient();
    const responseProcessor = new RealtimeResponseProcessor(metadata.workflowId || "unknown", metadata, emit, wsClient);

    // Track parallel tool calls — request the next response only when ALL
    // dispatched tools have completed AND the model's response.done has arrived
    // (a fast tool can finish before the response that requested it settles).
    let pendingToolCount = 0;
    let awaitingResponseDone = false;
    let needsSessionUpdate = false;

    const TOOL_TIMEOUT_MS = parseInt(process.env.REALTIME_TOOL_TIMEOUT_MS || "30000", 10);
    const withTimeout = <T>(promise: Promise<T>, ms: number, label: string): Promise<T> =>
      new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Tool ${label} timed out after ${ms}ms`)), ms);
        promise.then(
          (v) => {
            clearTimeout(timer);
            resolve(v);
          },
          (e) => {
            clearTimeout(timer);
            reject(e);
          },
        );
      });

    const saveTrace = (args: {
      toolName: string;
      toolInput: any;
      result: any;
      startTime: number;
      success: boolean;
      error?: string;
    }) => {
      if (!context?.api?.saveMCPTrace || !metadata.executionId || !metadata.nodeId) return;
      const endTime = Date.now();
      context.api
        .saveMCPTrace({
          executionId: metadata.executionId,
          parentNodeId: metadata.nodeId,
          toolName: args.toolName,
          arguments: args.toolInput,
          result: args.result,
          startTime: args.startTime,
          endTime,
          duration: endTime - args.startTime,
          success: args.success,
          ...(args.error ? { error: args.error } : {}),
        })
        .catch((err: any) => this.logger.warn("Failed to save MCP trace", { error: err?.message }));
    };

    const maybeRequestNextResponse = () => {
      if (pendingToolCount > 0 || awaitingResponseDone) return;
      if (needsSessionUpdate) {
        wsClient.send(SessionUpdateBuilder.build(config));
        this.logger.info("Registered discovered MCPs as tools");
        needsSessionUpdate = false;
      }
      wsClient.send(ResponseCreateBuilder.build());
    };

    const executeToolCall = async (toolName: string, toolInput: any, callId: string) => {
      // The entire body is guarded: this runs fire-and-forget, so any escape
      // would be an unhandled rejection and would skip the counter decrement
      try {
        this.logger.info("Tool use", { toolName, callId });
        const startTime = Date.now();
        let result: any;
        let toolError: string | undefined;

        try {
          if (config.mcpService?.[toolName]) {
            result = await withTimeout(config.mcpService[toolName](toolInput), TOOL_TIMEOUT_MS, toolName);
            emit?.({ __outputs: { mcpResult: { name: toolName, arguments: toolInput, result } } });
            saveTrace({ toolName, toolInput, result, startTime, success: true });
          } else {
            toolError = `No handler for tool: ${toolName}`;
            result = { error: toolError };
            saveTrace({ toolName, toolInput, result: null, startTime, success: false, error: toolError });
          }
        } catch (err: any) {
          toolError = `Tool execution failed: ${err.message}`;
          result = { error: toolError };
          saveTrace({ toolName, toolInput, result: null, startTime, success: false, error: toolError });
        }

        // Notify client that tool call finished
        try {
          const completionPublisher = new WebSocketAudioPublisher();
          await completionPublisher.publishState({
            state: "TOOL_USE_COMPLETED",
            conversationId,
            metadata,
            message: toolError ? `Tool failed: ${toolName}` : `Tool completed: ${toolName}`,
            additionalMetadata: { toolName, callId, error: toolError },
          });
        } catch (err: any) {
          this.logger.warn("Failed to publish TOOL_USE_COMPLETED", { error: err?.message });
        }

        // Send function output back to OpenAI
        let serialized: string;
        try {
          serialized = JSON.stringify(result);
        } catch {
          serialized = JSON.stringify({ error: "Tool result was not serializable" });
        }
        wsClient.send(ConversationItemBuilder.buildFunctionCallOutput(callId, serialized));

        // Register dynamically discovered MCP tools from findIntent/discoverRelated results
        if ((toolName === "findIntent" || toolName === "discoverRelated") && Array.isArray(result) && api?.callService) {
          config.tools = config.tools || [];
          config.mcpService = config.mcpService || {};
          for (const item of result) {
            if (item?.object_type === "mcp" && item?.metadata?.schema?.methods) {
              const methodName = Object.keys(item.metadata.schema.methods)[0];
              if (!methodName || config.mcpService[methodName]) continue;
              const methodDef = item.metadata.schema.methods[methodName];
              config.tools.push({
                type: "function",
                name: methodName,
                description: methodDef?.description || item.description || item.title,
                parameters: methodDef?.input || { type: "object", properties: { message: { type: "string" } } },
              });
              config.mcpService[methodName] = (input: any) => api.callService(methodName, input, context);
              needsSessionUpdate = true;
            }
          }
        }
      } catch (err: any) {
        this.logger.error("Tool call handling failed", { toolName, callId, error: err?.message });
        // Best effort: the model must not be left waiting on this call_id
        try {
          wsClient.send(
            ConversationItemBuilder.buildFunctionCallOutput(callId, JSON.stringify({ error: "Tool call failed" })),
          );
        } catch {
          /* socket may be closed */
        }
      } finally {
        pendingToolCount--;
        maybeRequestNextResponse();
      }
    };

    // Tool use handler — called SYNCHRONOUSLY per function-call event so the
    // pending count is accurate before any tool can complete
    responseProcessor.onToolUse = ({ toolName, toolInput, callId }) => {
      pendingToolCount++;
      awaitingResponseDone = true;
      void executeToolCall(toolName, toolInput, callId);
    };

    // The response that requested the tools has settled — safe to continue
    // once all dispatched tools have finished
    responseProcessor.onToolResponseDone = () => {
      awaitingResponseDone = false;
      maybeRequestNextResponse();
    };


    const session = this.sessionManager.createSession(config, metadata, responseProcessor, wsClient);

    // Connect
    await wsClient.connect(credentials.apiKey);
    realtimeSessionRegistry.register(conversationId, wsClient);
    const wsSubscriber = RealtimeWebSocketAudioSubscriber.getInstance();

    // From here on the OpenAI session is live and billed — any exit path MUST
    // close the socket and deregister, or the session is orphaned with no way
    // to end it
    try {
      wsClient.onMessage((event) => {
        responseProcessor.processEvent(event).catch((err) => {
          this.logger.error("Event processing error", { error: err.message });
        });
      });

      // Configure session
      wsClient.send(SessionUpdateBuilder.build(config));

      // Replay history
      if (config.conversationHistory?.length) {
        for (const msg of config.conversationHistory) {
          wsClient.send(
            msg.role === "user"
              ? ConversationItemBuilder.buildUserMessage(msg.content)
              : ConversationItemBuilder.buildAssistantMessage(msg.content),
          );
        }
      }

      // Send initial request first — model processing time provides a natural
      // buffer while the frontend initialises audio playback after SESSION_READY.
      if (config.initialRequest) {
        wsClient.send(ConversationItemBuilder.buildUserMessage(config.initialRequest));
        wsClient.send(ResponseCreateBuilder.build());
      }

      // Register mic audio subscriber
      wsSubscriber.registerSession(conversationId, metadata.chatId || "", wsClient);

      // Publish SESSION_READY — frontend begins audio playback setup on receipt
      const publisher = new WebSocketAudioPublisher();
      await publisher.publishState({
        state: "SESSION_READY",
        conversationId,
        metadata,
        message: "OpenAI Realtime audio session ready",
        additionalMetadata: { nodeId: context?.nodeId || "openairealtimevoice1", serverVad: true },
      });

      // Hold until WS closes (triggered by END_CALL)
      this.logger.info("⏳ [SESSION] Waiting for WebSocket close...", { conversationId });
      await wsClient.waitForClose();
      this.logger.info("🔚 [SESSION] WebSocket closed — session ending", { conversationId });
    } finally {
      wsClient.close(); // no-op if already closed
      this.sessionManager.endSession(session.sessionId);
      realtimeSessionRegistry.remove(conversationId);
      wsSubscriber.unregisterSession(conversationId);
    }

    responseProcessor.emitFinal();

    const result = responseProcessor.getUsageStats();

    // Save token usage
    if (result.total_tokens > 0) {
      try {
        await getPlatformDependencies().saveTokenUsage({
          workflowId: metadata.workflowId,
          executionId: metadata.executionId,
          nodeId: metadata.nodeId,
          nodeType: "OpenAIRealtimeVoice",
          model: REALTIME_MODEL_ID,
          usage: {
            total_tokens: result.total_tokens,
            input_tokens: result.inputTokens,
            output_tokens: result.outputTokens,
          },
          timestamp: new Date(),
        });
      } catch (err: any) {
        this.logger.error("Failed to save token usage", { error: err.message });
      }
    }

    return result;
  }

  private handleEndCall(conversationId: string): StreamUsageStats {
    const wsClient = realtimeSessionRegistry.get(conversationId);
    if (wsClient) {
      this.logger.info("END_CALL — closing Realtime WebSocket", { conversationId });
      wsClient.close();
    } else {
      this.logger.warn("END_CALL — no active session found", { conversationId });
    }
    return { ...EMPTY_STATS };
  }

  private getCredentials(context: any): { apiKey: string } {
    const available = (context as any).credentials || {};

    // Prefer the credential declared on the node definition: the platform passes
    // ALL workflow credentials here, and others (e.g. xAI) also carry an apiKey
    // field — the generic signature scan below could pick the wrong provider.
    const preferred = available.openaiCredential || available.openAICredential;
    if (preferred?.apiKey) {
      return { apiKey: preferred.apiKey };
    }

    // Fallback: field signature pattern (docs-starter/nodes/04-credentials.md)
    for (const val of Object.values(available)) {
      if ((val as any)?.apiKey) {
        return { apiKey: (val as any).apiKey };
      }
    }
    throw new Error("OpenAI credentials not configured");
  }
}
