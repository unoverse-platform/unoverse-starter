import { getPlatformDependencies } from "@gravity-platform/plugin-base";
import { StreamUsageStats, StreamingMetadata } from "../../api/types";
import { AudioHandler } from "./AudioHandler";
import { TextAccumulator } from "./TextAccumulator";
import { UsageStatsCollector } from "./UsageStatsCollector";
import { WebSocketAudioPublisher } from "../../io/publishers/WebSocketAudioPublisher";

const { createLogger } = getPlatformDependencies();

export class GrokResponseProcessor {
  private audioHandler: AudioHandler;
  private textAccumulator: TextAccumulator;
  private usageStatsCollector = new UsageStatsCollector();
  private audioStarted = false;
  private readonly logger = createLogger("GrokResponseProcessor");

  onToolUse?: (toolUse: { toolName: string; toolInput: any; callId: string }) => void;

  emitProgress(text: string): void {
    this.textAccumulator.emitProgress(text);
  }

  constructor(
    private sessionId: string,
    private metadata: StreamingMetadata,
    emit?: (output: any) => void,
  ) {
    const conversationId = metadata.conversationId || sessionId;
    this.audioHandler = new AudioHandler(conversationId, metadata);
    this.textAccumulator = new TextAccumulator(sessionId, emit);
  }

  async processEvent(event: any): Promise<void> {
    try {
      await this.routeEvent(event);
    } catch (err) {
      this.logger.error("Error processing event", {
        sessionId: this.sessionId,
        type: event?.type,
        error: err instanceof Error ? err.message : err,
      });
    }
  }

  private async routeEvent(event: any): Promise<void> {
    switch (event.type) {
      case "response.output_audio.delta":
        if (!this.audioStarted) {
          this.audioStarted = true;
          await this.audioHandler.handleAudioStart();
        }
        this.usageStatsCollector.incrementChunkCount();
        await this.audioHandler.bufferAudioChunk(event.delta);
        break;

      case "response.output_audio.done":
        await this.audioHandler.handleAudioEnd();
        this.audioStarted = false;
        break;

      case "response.output_audio_transcript.delta":
        this.textAccumulator.appendAssistant(event.delta ?? "");
        break;

      case "response.output_audio_transcript.done":
        // Full transcript available — use it as the definitive assistant text
        if (event.transcript) {
          this.textAccumulator.setAssistantText(event.transcript);
        }
        break;

      case "conversation.item.input_audio_transcription.completed":
        this.textAccumulator.setUserTranscript(event.transcript ?? "");
        break;

      case "response.function_call_arguments.done":
        await this.handleFunctionCall(event);
        break;

      case "session.updated":
        this.logger.debug("Session config accepted", {
          voice: event.session?.voice,
          turn_detection: event.session?.turn_detection,
          audio: event.session?.audio,
          input_audio_transcription: event.session?.input_audio_transcription,
        });
        break;

      case "input_audio_buffer.speech_started":
        this.logger.debug("VAD: speech started", { sessionId: this.sessionId });
        await this.publishUserSpeechState("USER_SPEECH_STARTED");
        break;

      case "input_audio_buffer.speech_stopped":
        this.logger.debug("VAD: speech stopped", { sessionId: this.sessionId });
        await this.publishUserSpeechState("USER_SPEECH_ENDED");
        break;

      case "input_audio_buffer.committed":
        this.logger.debug("Audio buffer committed", { sessionId: this.sessionId });
        break;

      case "response.done":
        // End of one turn — emit conversation pair, reset accumulators, keep WS open
        this.textAccumulator.emitConversation();
        this.textAccumulator.resetTurn();
        this.finalizeUsageStats(event);
        break;

      case "error":
        this.logger.error("Grok error event", { error: event.error, sessionId: this.sessionId });
        break;

      default:
        // Unhandled events (ping, response.output_item.added, etc.) are common
        // and noisy. Use debug level so they're hidden by default.
        this.logger.debug("Grok event (unhandled)", { type: event.type });
        break;
    }
  }

  private async publishUserSpeechState(state: "USER_SPEECH_STARTED" | "USER_SPEECH_ENDED"): Promise<void> {
    const conversationId = this.metadata.conversationId || this.sessionId;
    const publisher = new WebSocketAudioPublisher();
    try {
      await publisher.publishState({
        state,
        conversationId,
        metadata: this.metadata,
        message: state === "USER_SPEECH_STARTED" ? "User started speaking" : "User finished speaking",
      });
    } catch (err: any) {
      this.logger.warn("Failed to publish user speech state", { state, error: err?.message });
    }
  }

  private async handleFunctionCall(event: any): Promise<void> {
    const toolName = event.name;
    const callId = event.call_id;
    let toolInput: any = {};

    try {
      toolInput = JSON.parse(event.arguments || "{}");
    } catch {
      this.logger.warn("Failed to parse tool arguments", { arguments: event.arguments });
    }

    const conversationId = this.metadata.conversationId || this.sessionId;
    const publisher = new WebSocketAudioPublisher();
    await publisher.publishState({
      state: "TOOL_USE",
      conversationId,
      metadata: this.metadata,
      message: `Grok is using tool: ${toolName}`,
      additionalMetadata: { toolName, callId, toolInput },
    });

    if (this.onToolUse) {
      this.onToolUse({ toolName, toolInput, callId });
    }
  }

  private finalizeUsageStats(event: any): void {
    const usage = event.response?.usage;
    if (usage) {
      this.usageStatsCollector.setUsage(usage.input_tokens ?? 0, usage.output_tokens ?? 0);
    }
    this.usageStatsCollector.setTextResults(
      this.textAccumulator.getTranscription(),
      this.textAccumulator.getAssistantResponse(),
    );
  }

  emitFinal(): void {
    this.textAccumulator.emitFinal();
  }

  getUsageStats(): StreamUsageStats {
    return this.usageStatsCollector.getUsageStats();
  }

  async handleError(error: any): Promise<void> {
    this.logger.error("Stream error", { sessionId: this.sessionId, error: error.message || error });
    if (this.audioStarted) {
      await this.audioHandler.handleAudioEnd();
      this.audioStarted = false;
    }
  }

  cleanup(): void {
    this.audioHandler.cleanup();
    this.textAccumulator.resetTurn();
    this.usageStatsCollector.reset();
  }
}
