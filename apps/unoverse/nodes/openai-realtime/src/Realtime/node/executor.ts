import { getPlatformDependencies } from "@unoverse-platform/plugin-base";
import { OpenAIRealtimeConfig } from "../../util/types";
import { REALTIME_MODEL_ID } from "../constants";

const { CallbackNode } = getPlatformDependencies();

interface RealtimeVoiceState {
  isComplete: boolean;
}

export default class RealtimeVoiceExecutor extends CallbackNode<OpenAIRealtimeConfig, RealtimeVoiceState> {
  private logger: any;

  constructor() {
    super("OpenAIRealtimeVoice");
    this.logger = getPlatformDependencies().createLogger("RealtimeVoiceExecutor");
  }

  initializeState(_inputs: any): RealtimeVoiceState {
    return { isComplete: false };
  }

  async handleEvent(
    event: { type: string; inputs?: any; config?: any },
    state: RealtimeVoiceState,
    emit: (output: any) => void,
    context?: any
  ): Promise<RealtimeVoiceState> {
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
        providerId: "OpenAI Realtime Voice",
      };

      const { RealtimeVoiceService } = await import("../service");
      const service = new RealtimeVoiceService();

      const initialRequest = typeof config.initialRequest === "string"
        ? config.initialRequest
        : config.initialRequest?.toString?.() || "";

      this.logger.info("Config resolved", {
        hasInitialRequest: !!initialRequest,
        initialRequestType: typeof config.initialRequest,
        initialRequestValue: initialRequest?.slice(0, 50),
      });

      const stats = await service.generateVoiceStream(
        {
          systemPrompt: config.systemPrompt,
          conversationHistory: config.conversationHistory,
          initialRequest,
          voice: config.voice,
          turnDetection: config.turnDetection || "semantic_vad",
          maxResponseOutputTokens: config.maxResponseOutputTokens,
          redisChannel: config.redisChannel,
          controlSignal: action === "END_CALL" ? "END_CALL" : "START_CALL",
        },
        metadata,
        context,
        emit
      );

      this.logger.info(`RealtimeVoice turn complete in ${Date.now() - startTime}ms`, { action });
      return { ...state, isComplete: true };
    } catch (err: any) {
      this.logger.error("RealtimeVoice execution FAILED", {
        error: err.message,
        stack: err.stack?.split("\n").slice(0, 3).join(" | ")
      });
      // Rethrow so the engine emits NODE_ERROR — swallowing here makes a failed
      // call indistinguishable from a completed one downstream
      throw err;
    }
  }
}

export { RealtimeVoiceExecutor };
