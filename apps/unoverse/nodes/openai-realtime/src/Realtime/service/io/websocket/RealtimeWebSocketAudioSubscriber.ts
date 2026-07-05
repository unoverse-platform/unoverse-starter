import { getPlatformDependencies } from "@unoverse-platform/plugin-base";
import { WsClient } from "../../core/streaming/WsClient";
import { AudioAppendBuilder } from "../events/incoming/builders/AudioAppendBuilder";

function getLogger() {
  return getPlatformDependencies().createLogger("RealtimeWebSocketAudioSubscriber");
}

function getAudioWSManager() {
  return getPlatformDependencies().getAudioWebSocketManager?.();
}

function resample16kTo24k(input: Buffer): Buffer {
  const srcSamples = input.length / 2;
  const dstSamples = Math.round((srcSamples * 24000) / 16000);
  const output = Buffer.alloc(dstSamples * 2);
  const ratio = srcSamples / dstSamples;

  for (let i = 0; i < dstSamples; i++) {
    const srcPos = i * ratio;
    const srcIndex = Math.floor(srcPos);
    const frac = srcPos - srcIndex;

    const s0 = input.readInt16LE(srcIndex * 2);
    const s1 = srcIndex + 1 < srcSamples ? input.readInt16LE((srcIndex + 1) * 2) : s0;
    const sample = Math.round(s0 + frac * (s1 - s0));
    output.writeInt16LE(Math.max(-32768, Math.min(32767, sample)), i * 2);
  }

  return output;
}

interface RealtimeAudioSession {
  wsClient: WsClient;
  chatId: string;
  isActive: boolean;
}

export class RealtimeWebSocketAudioSubscriber {
  private sessions = new Map<string, RealtimeAudioSession>();
  private static instance: RealtimeWebSocketAudioSubscriber;
  private logger = getLogger();

  private constructor() {
    this.setupWebSocketHandlers();
  }

  static getInstance(): RealtimeWebSocketAudioSubscriber {
    if (!RealtimeWebSocketAudioSubscriber.instance) {
      RealtimeWebSocketAudioSubscriber.instance = new RealtimeWebSocketAudioSubscriber();
    }
    return RealtimeWebSocketAudioSubscriber.instance;
  }

  private setupWebSocketHandlers(): void {
    const audioWSManager = getAudioWSManager();
    if (audioWSManager?.setAudioDataHandler) {
      audioWSManager.setAudioDataHandler(this.handleAudioData.bind(this));
      audioWSManager.setControlMessageHandler(this.handleControlMessage.bind(this));
      this.logger.info("Realtime WebSocket audio subscriber registered");
    } else {
      this.logger.warn("AudioWebSocketManager not available");
    }
  }

  registerSession(wsSessionId: string, chatId: string, wsClient: WsClient): void {
    this.sessions.set(wsSessionId, { wsClient, chatId, isActive: true });

    const audioWSManager = getAudioWSManager();
    audioWSManager?.startAudioSession?.(wsSessionId, wsSessionId);

    this.logger.info("Realtime audio session registered", { wsSessionId, chatId });
  }

  async handleAudioData(sessionId: string, audioData: ArrayBuffer): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) return;
    if (!session.wsClient.isOpen) {
      this.logger.warn("Mic audio but WsClient is closed", { sessionId });
      return;
    }

    const resampled = resample16kTo24k(Buffer.from(audioData));
    const base64 = resampled.toString("base64");
    session.wsClient.send(AudioAppendBuilder.build(base64));
  }

  async handleControlMessage(sessionId: string, message: any): Promise<void> {
    const type = message?.type;
    if (type === "stop" || type === "END_CALL") {
      const session = this.sessions.get(sessionId);
      if (!session) return;
      this.logger.info("Control 'stop' — closing Realtime WebSocket", { sessionId });
      session.isActive = false;
      try {
        session.wsClient.close();
      } catch (err: any) {
        this.logger.warn("Error closing WS on stop", { sessionId, error: err?.message });
      }
    }
  }

  unregisterSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.delete(sessionId);
      this.logger.info("Realtime audio session unregistered", { sessionId });
    }
  }
}
