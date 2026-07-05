import { getPlatformDependencies } from "@gravity-platform/plugin-base";
import { XAIGrokVoiceConfig } from "../../util/types";
import { GROK_MODEL_ID } from "../constants";

const { CallbackNode } = getPlatformDependencies();

interface GrokVoiceState {
  isComplete: boolean;
}

export default class GrokVoiceExecutor extends CallbackNode<XAIGrokVoiceConfig, GrokVoiceState> {
  private logger: any;

  constructor() {
    super("XAIGrokVoice");
    this.logger = getPlatformDependencies().createLogger("GrokVoiceExecutor");
  }

  initializeState(_inputs: any): GrokVoiceState {
    return { isComplete: false };
  }

  async handleEvent(
    event: { type: string; inputs?: any; config?: any },
    state: GrokVoiceState,
    emit: (output: any) => void,
    context?: any
  ): Promise<GrokVoiceState> {
    if (state.isComplete) return state;
    if (!context) {
      this.logger.error("No execution context provided");
      return { ...state, isComplete: true };
    }

    const { inputs, config } = event;
    const startTime = Date.now();

    this.logger.info("handleEvent called", { type: event.type, isComplete: state.isComplete });

    try {
      const pubContext = context.publishingContext || {};
      const workflowVars = context.workflow?.variables || {};

      const chatId = pubContext.chatId || workflowVars.chatId || "";
      const conversationId = pubContext.conversationId || workflowVars.conversationId || "";
      const userId = pubContext.userId || workflowVars.userId || "";

      const inputObj = inputs?.input;
      const firstKey = inputObj ? Object.keys(inputObj)[0] : null;
      const sourceData = firstKey ? inputObj[firstKey] : null;
      const inputData = sourceData?.output || sourceData;
      const action = inputData?.metadata?.action;

      const metadata = {
        workflowId: context.workflowId || context.workflow?.id || "",
        executionId: context.executionId,
        nodeId: context.nodeId,
        chatId,
        conversationId,
        userId,
        providerId: "xAI Grok Voice",
      };

      const { GrokVoiceService } = await import("../service");
      const service = new GrokVoiceService();

      const stats = await service.generateVoiceStream(
        {
          systemPrompt: config.systemPrompt,
          conversationHistory: config.conversationHistory,
          initialRequest: config.initialRequest,
          voice: config.voice,
          turnDetection: config.turnDetection || "server_vad",
          redisChannel: config.redisChannel,
          controlSignal: action === "END_CALL" ? "END_CALL" : "START_CALL",
        },
        metadata,
        context,
        emit
      );

      if (stats.total_tokens && stats.total_tokens > 0) {
        try {
          await getPlatformDependencies().saveTokenUsage({
            workflowId: metadata.workflowId,
            executionId: metadata.executionId,
            nodeId: context.nodeId,
            nodeType: "XAIGrokVoice",
            model: GROK_MODEL_ID,
            usage: {
              total_tokens: stats.total_tokens,
              input_tokens: stats.inputTokens || 0,
              output_tokens: stats.outputTokens || 0,
            },
            timestamp: new Date(),
          });
        } catch (err: any) {
          this.logger.error("Failed to save token usage", { error: err.message });
        }
      }

      // Always complete after the session ends (either END_CALL or natural WebSocket close)
      // The service.generateVoiceStream() returns when the WS closes, so we're done
      this.logger.info(`GrokVoice turn complete in ${Date.now() - startTime}ms`, { action });
      return { ...state, isComplete: true };
    } catch (err: any) {
      this.logger.error("GrokVoice execution FAILED — returning isComplete:true", { error: err.message, stack: err.stack?.split("\n").slice(0, 3).join(" | ") });
      return { ...state, isComplete: true };
    }
  }
}

export { GrokVoiceExecutor };
