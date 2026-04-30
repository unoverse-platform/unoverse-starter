import { getPlatformDependencies } from "@gravity-platform/plugin-base";
import { XAIGrokVoiceConfig, StreamUsageStats, StreamingMetadata } from "../../api/types";
import { WsClient } from "../streaming/WsClient";
import { SessionManager } from "../streaming/SessionManager";
import { GrokResponseProcessor } from "../processing/ResponseProcessor";
import { grokSessionRegistry } from "../streaming/GrokSessionRegistry";
import { SessionUpdateBuilder } from "../../io/events/incoming/builders/SessionUpdateBuilder";
import { ConversationItemBuilder } from "../../io/events/incoming/builders/ConversationItemBuilder";
import { ResponseCreateBuilder } from "../../io/events/incoming/builders/ResponseCreateBuilder";
import { GrokWebSocketAudioSubscriber } from "../../io/websocket/GrokWebSocketAudioSubscriber";
import { WebSocketAudioPublisher } from "../../io/publishers/WebSocketAudioPublisher";

const { createLogger } = getPlatformDependencies();

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
  private readonly logger = createLogger("GrokSessionOrchestrator");
  private sessionManager = new SessionManager();

  async orchestrateSession(
    config: XAIGrokVoiceConfig,
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
    config: XAIGrokVoiceConfig,
    metadata: StreamingMetadata,
    context: any,
    emit: ((output: any) => void) | undefined,
    conversationId: string,
  ): Promise<StreamUsageStats> {
    // MCP discovery
    const api = context?.api;
    if (api?.callService) {
      try {
        const mcpSchema = await api.callService("getSchema", {}, context);
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
      }
    }

    // Credentials
    const { getNodeCredentials } = getPlatformDependencies();
    const credentials = await getNodeCredentials(context, "xaiCredential");
    if (!credentials?.apiKey) {
      throw new Error("xAI credentials not found");
    }

    const wsClient = new WsClient();
    const responseProcessor = new GrokResponseProcessor(metadata.workflowId || "unknown", metadata, emit);

    // Tool use handler
    responseProcessor.onToolUse = async ({ toolName, toolInput, callId }) => {
      this.logger.info("Tool use", { toolName, callId });
      responseProcessor.emitProgress(`Calling tool: ${toolName}...\n`);
      const startTime = Date.now();
      let result: any;
      let toolError: string | undefined;
      try {
        if (config.mcpService?.[toolName]) {
          result = await config.mcpService[toolName](toolInput);
          const endTime = Date.now();
          responseProcessor.emitProgress(`Tool complete: ${toolName}\n`);
          emit?.({ __outputs: { mcpResult: { name: toolName, arguments: toolInput, result } } });
          if (context?.api?.saveMCPTrace && metadata.executionId && metadata.nodeId) {
            context.api.saveMCPTrace({
              executionId: metadata.executionId,
              parentNodeId: metadata.nodeId,
              toolName,
              arguments: toolInput,
              result,
              startTime,
              endTime,
              duration: endTime - startTime,
              success: true,
            }).catch((err: any) => this.logger.warn("Failed to save MCP trace", { error: err?.message }));
          }
        } else {
          toolError = `No handler for tool: ${toolName}`;
          result = { error: toolError };
          const endTime = Date.now();
          responseProcessor.emitProgress(`Tool error: ${toolName} — ${toolError}\n`);
          if (context?.api?.saveMCPTrace && metadata.executionId && metadata.nodeId) {
            context.api.saveMCPTrace({
              executionId: metadata.executionId,
              parentNodeId: metadata.nodeId,
              toolName,
              arguments: toolInput,
              result: null,
              startTime,
              endTime,
              duration: endTime - startTime,
              success: false,
              error: toolError,
            }).catch((err: any) => this.logger.warn("Failed to save MCP trace", { error: err?.message }));
          }
        }
      } catch (err: any) {
        toolError = `Tool execution failed: ${err.message}`;
        result = { error: toolError };
        const endTime = Date.now();
        responseProcessor.emitProgress(`Tool error: ${toolName} — ${toolError}\n`);
        if (context?.api?.saveMCPTrace && metadata.executionId && metadata.nodeId) {
          context.api.saveMCPTrace({
            executionId: metadata.executionId,
            parentNodeId: metadata.nodeId,
            toolName,
            arguments: toolInput,
            result: null,
            startTime,
            endTime,
            duration: endTime - startTime,
            success: false,
            error: toolError,
          }).catch((err2: any) => this.logger.warn("Failed to save MCP trace", { error: err2?.message }));
        }
      }

      // Notify the client that the tool call finished so the UI can dismiss
      // the "looking up knowledge base" indicator.
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

      wsClient.send(ConversationItemBuilder.buildFunctionCallOutput(callId, JSON.stringify(result)));

      // Same pattern as ChatGPTAgent: when findIntent/discoverRelated returns,
      // the result itself contains MCPs in metadata.schema.methods. Register them
      // as new tools and re-send session.update so Grok can call them next turn.
      if ((toolName === "findIntent" || toolName === "discoverRelated") && Array.isArray(result) && api?.callService) {
        const added: string[] = [];
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
            added.push(methodName);
          }
        }
        if (added.length > 0) {
          wsClient.send(SessionUpdateBuilder.build(config));
          this.logger.info("Registered discovered MCPs as Grok tools", { added });
        }
      }

      wsClient.send(ResponseCreateBuilder.build());
    };

    const session = this.sessionManager.createSession(config, metadata, responseProcessor, wsClient);

    // Connect
    await wsClient.connect(credentials.apiKey);
    grokSessionRegistry.register(conversationId, wsClient);

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

    // Initial request
    if (config.initialRequest) {
      wsClient.send(ConversationItemBuilder.buildUserMessage(config.initialRequest));
      wsClient.send(ResponseCreateBuilder.build());
    }

    // Register mic audio subscriber
    const wsSubscriber = GrokWebSocketAudioSubscriber.getInstance();
    wsSubscriber.registerSession(conversationId, metadata.chatId || "", wsClient);

    // Publish SESSION_READY
    const publisher = new WebSocketAudioPublisher();
    await publisher.publishState({
      state: "SESSION_READY",
      conversationId,
      metadata,
      message: "Grok audio session ready",
      additionalMetadata: { nodeId: context?.nodeId || "xaiGrokVoice1", serverVad: true },
    });

    // Hold until WS closes (triggered by END_CALL)
    await wsClient.waitForClose();

    // Emit final text output now that the session is truly over
    responseProcessor.emitFinal();

    const result = responseProcessor.getUsageStats();
    this.sessionManager.endSession(session.sessionId);
    grokSessionRegistry.remove(conversationId);
    wsSubscriber.unregisterSession(conversationId);

    return result;
  }

  private handleEndCall(conversationId: string): StreamUsageStats {
    const wsClient = grokSessionRegistry.get(conversationId);
    if (wsClient) {
      this.logger.info("END_CALL — closing Grok WebSocket", { conversationId });
      wsClient.close();
    } else {
      this.logger.warn("END_CALL — no active session found", { conversationId });
    }
    return { ...EMPTY_STATS };
  }
}
