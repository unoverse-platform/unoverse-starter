import { getPlatformDependencies } from "@gravity-platform/plugin-base";
import { StreamingMetadata } from "../../api/types";
import { WebSocketAudioPublisher } from "../../io/publishers/WebSocketAudioPublisher";

const { createLogger } = getPlatformDependencies();
const logger = createLogger("GrokAudioHandler");

export class AudioHandler {
  private chunkIndex = 0;
  private publisher = new WebSocketAudioPublisher();

  constructor(
    private conversationId: string,
    private metadata: StreamingMetadata,
  ) {}

  async handleAudioStart(): Promise<void> {
    // Emit SPEECH_STARTED so the client lights up the assistant-speaking
    // animation immediately, before the first audio chunk finishes buffering.
    // Safe now that the client streams mic audio continuously and only mutes
    // on explicit user action (no more auto-mute on SPEECH_STARTED).
    await this.publisher.publishState({
      state: "SPEECH_STARTED",
      conversationId: this.conversationId,
      metadata: this.metadata,
      message: "Assistant started speaking",
    });
  }

  async bufferAudioChunk(base64Audio: string): Promise<void> {
    await this.publisher.publishAudio({
      audioData: base64Audio,
      format: "pcm16",
      sourceType: "GrokVoice",
      conversationId: this.conversationId,
      metadata: this.metadata,
      audioState: "SPEECH_STREAMING",
      index: this.chunkIndex++,
    });
  }

  async handleAudioEnd(): Promise<void> {
    // Emit SPEECH_ENDED so the client knows audio playback is done
    // (needed to clear isPlaying state). We deliberately skip SPEECH_STARTED
    // so the client mic/VAD is never paused — Grok handles VAD server-side.
    await this.publisher.publishState({
      state: "SPEECH_ENDED",
      conversationId: this.conversationId,
      metadata: this.metadata,
      message: "Assistant finished speaking",
    });
    await this.publisher.cleanup(this.conversationId);
  }

  cleanup(): void {
    this.chunkIndex = 0;
  }
}
