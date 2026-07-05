import { getPlatformDependencies } from "@unoverse-platform/plugin-base";
import { StreamingMetadata, StreamUsageStats } from "../../../../util/types";
import { AudioHandler } from "./AudioHandler";
import { TextAccumulator } from "./TextAccumulator";
import { UsageStatsCollector } from "./UsageStatsCollector";
import { WebSocketAudioPublisher } from "../../io/publishers/WebSocketAudioPublisher";
import type { WsClient } from "../streaming/WsClient";

// Module-level platform calls cause startup freezes (docs-starter/nodes/CLAUDE.md
// rule 5) — resolve the logger lazily instead
function getLogger() {
  return getPlatformDependencies().createLogger("RealtimeResponseProcessor");
}

export class RealtimeResponseProcessor {
  private audioHandler: AudioHandler;
  private textAccumulator: TextAccumulator;
  private usageStatsCollector = new UsageStatsCollector();
  private audioStarted = false;
  private readonly logger = getLogger();

  private hasToolCallsInCurrentResponse = false;

  /** Called synchronously per function-call event — must not be awaited so the
   *  orchestrator's pending count is accurate before any tool can complete */
  onToolUse?: (toolUse: { toolName: string; toolInput: any; callId: string }) => void;

  /** Called when a response that dispatched tool calls reaches response.done */
  onToolResponseDone?: () => void;

  emitProgress(text: string): void {
    this.textAccumulator.emitProgress(text);
  }

  constructor(
    private sessionId: string,
    private metadata: StreamingMetadata,
    emit?: (output: any) => void,
    private wsClient?: WsClient,
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

      case "session.created":
        this.logger.info("Session created", { session: event.session });
        break;

      case "session.updated":
        this.logger.debug("Session config accepted", {
          voice: event.session?.audio?.output?.voice,
          turn_detection: event.session?.audio?.input?.turn_detection,
        });
        break;

      case "input_audio_buffer.speech_started":
        this.logger.debug("VAD: speech started", { sessionId: this.sessionId });
        if (this.audioStarted) {
          // Barge-in: drop buffered assistant audio rather than flushing it
          await this.audioHandler.handleInterruption();
          this.audioStarted = false;
        }
        this.textAccumulator.resetTurn();
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
        this.handleResponseDone(event);
        break;

      case "response.function_call_arguments.delta":
      case "response.output_item.added":
      case "response.output_item.done":
      case "response.content_part.added":
      case "response.content_part.done":
      case "response.created":
      case "conversation.item.created":
      case "conversation.item.done":
      case "conversation.item.added":
      case "rate_limits.updated":
        break;

      case "error":
        this.logger.error("Realtime API error", { error: event.error, sessionId: this.sessionId });
        break;

      default:
        this.logger.debug("Unhandled event", { type: event.type });
        break;
    }
  }

  private handleResponseDone(event: any): void {
    this.finalizeUsageStats(event);

    if (this.hasToolCallsInCurrentResponse) {
      // Tool calls were dispatched — the orchestrator sends response.create once
      // all tool outputs are submitted AND this response has settled
      this.hasToolCallsInCurrentResponse = false;
      this.onToolResponseDone?.();
      return;
    }

    // Normal text/audio response — emit conversation turn
    this.textAccumulator.emitConversation();
    this.textAccumulator.resetTurn();
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

    this.hasToolCallsInCurrentResponse = true;

    // Dispatch FIRST, synchronously — awaiting the state publish before counting
    // opens a race where a fast parallel tool hits zero pending and requests the
    // next response early
    if (this.onToolUse) {
      this.onToolUse({ toolName, toolInput, callId });
    }

    const conversationId = this.metadata.conversationId || this.sessionId;
    const publisher = new WebSocketAudioPublisher();
    await publisher.publishState({
      state: "TOOL_USE",
      conversationId,
      metadata: this.metadata,
      message: `Using tool: ${toolName}`,
      additionalMetadata: { toolName, callId, toolInput },
    });
  }

  private finalizeUsageStats(event: any): void {
    const usage = event.response?.usage;
    if (usage) {
      this.usageStatsCollector.addUsage(usage.input_tokens ?? 0, usage.output_tokens ?? 0);
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
