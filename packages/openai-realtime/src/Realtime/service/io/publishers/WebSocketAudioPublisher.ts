import { getPlatformDependencies } from "@gravity-platform/plugin-base";
import { StreamingMetadata, AudioState } from "../../../../util/types";

function getLogger() {
  return getPlatformDependencies().createLogger("RealtimeWebSocketAudioPublisher");
}

function getAudioWSManager() {
  return getPlatformDependencies().getAudioWebSocketManager?.();
}

const TARGET_CHUNK_SIZE = 32768;
const MAX_BUFFER_DELAY = 50;

interface ChunkBuffer {
  chunks: Buffer[];
  totalSize: number;
  timer?: NodeJS.Timeout;
}

export class WebSocketAudioPublisher {
  private chunkBuffers = new Map<string, ChunkBuffer>();

  async publishAudio(config: {
    audioData: string;
    format: string;
    sourceType: string;
    conversationId: string;
    metadata: StreamingMetadata;
    audioState: AudioState;
    index: number;
  }): Promise<void> {
    const audioWSManager = getAudioWSManager();
    if (!audioWSManager) return;

    if (config.audioState === "SPEECH_STARTED" || config.audioState === "SPEECH_ENDED") {
      audioWSManager.sendControl(config.conversationId, {
        type: "audioState",
        state: config.audioState,
        metadata: config.metadata,
      });
      if (config.audioState === "SPEECH_ENDED") {
        await this.flushBuffer(config.conversationId);
      }
      return;
    }

    const audioBuffer = Buffer.from(config.audioData, "base64");
    this.addToBuffer(config.conversationId, audioBuffer);
  }

  private addToBuffer(conversationId: string, chunk: Buffer): void {
    let buffer = this.chunkBuffers.get(conversationId);
    if (!buffer) {
      buffer = { chunks: [], totalSize: 0 };
      this.chunkBuffers.set(conversationId, buffer);
    }

    buffer.chunks.push(chunk);
    buffer.totalSize += chunk.length;

    if (buffer.timer) clearTimeout(buffer.timer);

    if (buffer.totalSize >= TARGET_CHUNK_SIZE) {
      this.flushBuffer(conversationId);
    } else {
      buffer.timer = setTimeout(() => this.flushBuffer(conversationId), MAX_BUFFER_DELAY);
    }
  }

  private async flushBuffer(conversationId: string): Promise<void> {
    const buffer = this.chunkBuffers.get(conversationId);
    if (!buffer || buffer.chunks.length === 0) return;

    const audioWSManager = getAudioWSManager();
    if (!audioWSManager) return;

    const combined = Buffer.concat(buffer.chunks);
    audioWSManager.sendAudio(conversationId, combined);

    buffer.chunks = [];
    buffer.totalSize = 0;
    if (buffer.timer) {
      clearTimeout(buffer.timer);
      buffer.timer = undefined;
    }
  }

  async publishState(config: {
    state: AudioState | string;
    conversationId?: string;
    metadata?: StreamingMetadata;
    message?: string;
    additionalMetadata?: Record<string, unknown>;
  }): Promise<void> {
    const audioWSManager = getAudioWSManager();
    if (!audioWSManager || !config.conversationId) return;

    if (config.state === "SPEECH_ENDED") {
      await this.flushBuffer(config.conversationId);
    }

    const mergedMetadata = { ...(config.metadata || {}), ...(config.additionalMetadata || {}) };
    audioWSManager.sendControl(config.conversationId, {
      type: "AUDIO_STATE",
      state: config.state,
      message: config.message,
      metadata: mergedMetadata,
    });
  }

  /**
   * Drop any buffered audio without sending it — used on user barge-in so the
   * client doesn't hear a trailing fragment of the interrupted response
   */
  discardBuffer(conversationId: string): void {
    const buffer = this.chunkBuffers.get(conversationId);
    if (buffer?.timer) clearTimeout(buffer.timer);
    this.chunkBuffers.delete(conversationId);
  }

  async cleanup(conversationId: string): Promise<void> {
    await this.flushBuffer(conversationId);
    const buffer = this.chunkBuffers.get(conversationId);
    if (buffer?.timer) clearTimeout(buffer.timer);
    this.chunkBuffers.delete(conversationId);
  }
}
