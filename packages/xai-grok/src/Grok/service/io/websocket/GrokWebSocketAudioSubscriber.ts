import { getPlatformDependencies } from "@gravity-platform/plugin-base";
import { WsClient } from "../../core/streaming/WsClient";
import { AudioAppendBuilder } from "../events/incoming/builders/AudioAppendBuilder";

const { createLogger, getAudioWebSocketManager } = getPlatformDependencies();
const logger = createLogger("GrokWebSocketAudioSubscriber");

interface GrokAudioSession {
  wsClient: WsClient;
  chatId: string;
  isActive: boolean;
}

export class GrokWebSocketAudioSubscriber {
  private sessions = new Map<string, GrokAudioSession>();
  private static instance: GrokWebSocketAudioSubscriber;

  private constructor() {
    this.setupWebSocketHandlers();
  }

  static getInstance(): GrokWebSocketAudioSubscriber {
    if (!GrokWebSocketAudioSubscriber.instance) {
      GrokWebSocketAudioSubscriber.instance = new GrokWebSocketAudioSubscriber();
    }
    return GrokWebSocketAudioSubscriber.instance;
  }

  private setupWebSocketHandlers(): void {
    const audioWSManager = getAudioWebSocketManager?.();
    if (audioWSManager?.setAudioDataHandler) {
      audioWSManager.setAudioDataHandler(this.handleAudioData.bind(this));
      audioWSManager.setControlMessageHandler(this.handleControlMessage.bind(this));
      logger.info("Grok WebSocket audio subscriber registered");
    } else {
      logger.warn("AudioWebSocketManager not available");
    }
  }

  registerSession(wsSessionId: string, chatId: string, wsClient: WsClient): void {
    this.sessions.set(wsSessionId, { wsClient, chatId, isActive: true });

    const audioWSManager = getAudioWebSocketManager?.();
    audioWSManager?.startAudioSession?.(wsSessionId, wsSessionId);

    logger.info("Grok audio session registered", { wsSessionId, chatId });
  }

  async handleAudioData(sessionId: string, audioData: ArrayBuffer): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      logger.debug("Mic audio for unregistered session", {
        sessionId,
        knownSessions: Array.from(this.sessions.keys()),
      });
      return;
    }
    if (!session.isActive) return;
    if (!session.wsClient.isOpen) {
      logger.warn("Mic audio but WsClient is closed", { sessionId });
      return;
    }

    const base64 = Buffer.from(audioData).toString("base64");
    session.wsClient.send(AudioAppendBuilder.build(base64));
  }

  async handleControlMessage(sessionId: string, message: any): Promise<void> {
    const type = message?.type;
    if (type === "stop" || type === "END_CALL") {
      const session = this.sessions.get(sessionId);
      if (!session) {
        logger.warn("Control 'stop' for unknown session", { sessionId });
        return;
      }
      logger.info("Control 'stop' — closing Grok WebSocket", { sessionId });
      session.isActive = false;
      try {
        session.wsClient.close();
      } catch (err: any) {
        logger.warn("Error closing Grok WS on stop", { sessionId, error: err?.message });
      }
    }
    // 'start', 'mute', 'unmute' are no-ops here — mute is handled client-side and
    // start is handled by the executor controlSignal path.
  }

  unregisterSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.delete(sessionId);
      logger.info("Grok audio session unregistered", { sessionId });
    }
  }
}
