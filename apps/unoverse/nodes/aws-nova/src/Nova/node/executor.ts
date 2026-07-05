/**
 * AWS Nova Speech Node Executor
 * Handles speech generation using AWS Nova Sonic
 */

import { getPlatformDependencies } from "@unoverse-platform/plugin-base";
import { AWSNovaSpeechConfig } from "../../util/types";
import type { VoiceOption } from "../service";
import { NOVA_MODEL_ID } from "../constants";

const { CallbackNode, saveTokenUsage, createLogger } = getPlatformDependencies();

interface NovaSpeechState {
  isComplete: boolean;
}

export default class NovaSpeechExecutor extends CallbackNode<AWSNovaSpeechConfig, NovaSpeechState> {
  private logger: any;

  constructor() {
    super("AWSNovaSpeech");
    this.logger = createLogger("NovaSpeechExecutor");
  }

  /**
   * Initialize state
   */
  initializeState(inputs: any): NovaSpeechState {
    return {
      isComplete: false,
    };
  }

  /**
   * Handle events
   */
  async handleEvent(
    event: { type: string; inputs?: any; config?: any },
    state: NovaSpeechState,
    emit: (output: any) => void,
    context?: any, // NodeExecutionContext from the framework
  ): Promise<NovaSpeechState> {
    // If already complete, return
    if (state.isComplete) {
      return state;
    }

    // Need context to proceed
    if (!context) {
      this.logger.error("No execution context provided");
      return { ...state, isComplete: true };
    }

    const { inputs, config } = event;
    const startTime = Date.now();

    try {
      this.logger.info("Executing AWS Nova Speech node", {
        workflowId: context.workflowId,
        executionId: context.executionId,
      });

      // Get workflow variables from context - check both workflow.variables and publishingContext
      const workflowVars = context.workflow?.variables || {};
      const pubContext = context.publishingContext || {};

      // Prefer publishingContext (runtime) over workflow.variables (may be empty in distributed mode)
      const chatId = pubContext.chatId || workflowVars.chatId || "";
      const conversationId = pubContext.conversationId || workflowVars.conversationId || "";
      const userId = pubContext.userId || workflowVars.userId || "";
      const providerId = workflowVars.providerId || "AWS Nova Speech";

      // Get action from input metadata (passed from client via START_CALL/END_CALL)
      // Structure: inputs.input.[sourceNodeId].output.metadata.action
      const inputObj = inputs?.input;
      const firstKey = inputObj ? Object.keys(inputObj)[0] : null;
      const sourceData = firstKey ? inputObj[firstKey] : null;
      // The InputTrigger wraps data in "output"
      const inputData = sourceData?.output || sourceData;
      const action = inputData?.metadata?.action;

      this.logger.debug("Nova executor context", { action, conversationId, chatId });

      // Build metadata for the service using context (like BedrockClaude)
      const metadata = {
        workflowId: context.workflowId || context.workflow?.id || "",
        executionId: context.executionId,
        nodeId: context.nodeId,
        chatId,
        conversationId,
        userId,
        providerId,
        workflowRunId: context.executionId,
      };

      // Use chatId as the sessionId for streaming
      const streamId = chatId;

      // Debug-level logging - won't appear in production
      this.logger.debug("Nova config", {
        voice: config.voice,
        hasSystemPrompt: !!config.systemPrompt,
        historyCount: config.conversationHistory?.length || 0,
      });

      // Dynamically import and create Nova Speech service instance to avoid module-level initialization
      const { NovaSpeechService } = await import("../service");
      const service = new NovaSpeechService();

      // Call the service with all configuration including control signal
      const stats = await service.generateSpeechStream(
        {
          systemPrompt: config.systemPrompt,
          conversationHistory: config.conversationHistory,
          initialRequest: config.initialRequest, // Text sent as USER message at call start
          voice: config.voice as VoiceOption,
          redisChannel: config.redisChannel,
          maxTokens: config.maxTokens || 2000,
          temperature: config.temperature || 0.7,
          topP: config.topP || 0.3,
          controlSignal: action === "END_CALL" ? "END_CALL" : "START_CALL",
        },
        metadata,
        context, // Pass the context (same as PromiseNodes!)
        emit, // Pass the emit function so TextAccumulator can emit outputs!
        // Note: userQuery param omitted - Nova discovers ALL MCPs at session start
      );
      const textOutput = stats.textOutput;
      const transcription = stats.transcription;
      const assistantResponse = stats.assistantResponse;

      this.logger.info("Speech stream completed", {
        streamId,
        chatId: chatId || "",
        textOutput: textOutput ? `${textOutput.substring(0, 100)}...` : "No text output",
        audioOutput: stats.audioOutput ? "Audio generated" : "No audio output",
        totalTokens: stats.total_tokens,
      });

      // Save token usage to database if we have usage data
      if (stats.total_tokens && stats.total_tokens > 0) {
        this.logger.debug("Token stats", {
          total: stats.total_tokens,
          input: stats.inputTokens,
          output: stats.outputTokens,
        });

        try {
          await saveTokenUsage({
            workflowId: metadata.workflowId,
            executionId: metadata.executionId,
            nodeId: context.nodeId,
            nodeType: "AWSNovaSpeech",
            model: NOVA_MODEL_ID,
            usage: {
              total_tokens: stats.total_tokens,
              input_tokens: stats.inputTokens || 0,
              output_tokens: stats.outputTokens || 0,
            },
            timestamp: new Date(),
          });
          this.logger.info(
            `Nova Speech token usage saved: ${stats.total_tokens} tokens (input: ${stats.inputTokens || 0}, output: ${
              stats.outputTokens || 0
            })`,
          );
        } catch (error: any) {
          this.logger.error("Failed to save Nova Speech token usage", { error: error.message });
        }
      }

      // TextAccumulator already emits text incrementally during streaming
      // No need to emit again here

      this.logger.info(`🎯 [NovaSpeech] Completed execution, total time: ${Date.now() - startTime}ms`);

      // Return state marking completion
      return {
        ...state,
        isComplete: true,
      };
    } catch (error: any) {
      this.logger.error("Failed to generate speech", {
        error: error.message,
        code: error.name,
        workflowId: context?.workflowId,
      });

      // Return error state
      return {
        ...state,
        isComplete: true,
      };
    }
  }
}

// Export as named export for backward compatibility
export { NovaSpeechExecutor };
