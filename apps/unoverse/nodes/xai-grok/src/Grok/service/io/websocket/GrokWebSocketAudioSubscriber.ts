import { getPlatformDependencies } from "@gravity-platform/plugin-base";
import { WsClient } from "../../core/streaming/WsClient";
import { AudioAppendBuilder } from "../events/incoming/builders/AudioAppendBuilder";

function getLogger() {
  return getPlatformDependencies().createLogger("GrokWebSocketAudioSubscriber");
}

function getAudioWSManager() {
  return getPlatformDependencies().getAudioWebSocketManager?.();
}

interface GrokAudioSession {
  wsClient: WsClient;
  chatId: string;
  isActive: boolean;
}

export class GrokWebSocketAudioSubscriber {
  private sessions = new Map<string, GrokAudioSession>();
  private static instance: GrokWebSocketAudioSubscriber;
  private logger = getLogger();

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
    const audioWSManager = getAudioWSManager();
    if (audioWSManager?.setAudioDataHandler) {
      audioWSManager.setAudioDataHandler(this.handleAudioData.bind(this));
      audioWSManager.setControlMessageHandler(this.handleControlMessage.bind(this));
      this.logger.info("Grok WebSocket audio subscriber registered");
    } else {
      this.logger.warn("AudioWebSocketManager not available");
    }
  }

  registerSession(wsSessionId: string, chatId: string, wsClient: WsClient): void {
    this.sessions.set(wsSessionId, { wsClient, chatId, isActive: true });

    const audioWSManager = getAudioWSManager();
    audioWSManager?.startAudioSession?.(wsSessionId, wsSessionId);

    this.logger.info("Grok audio session registered", { wsSessionId, chatId });
  }

  async handleAudioData(sessionId: string, audioData: ArrayBuffer): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      this.logger.debug("Mic audio for unregistered session", {
        sessionId,
        knownSessions: Array.from(this.sessions.keys()),
      });
      return;
    }
    if (!session.isActive) return;
    if (!session.wsClient.isOpen) {
      this.logger.warn("Mic audio but WsClient is closed", { sessionId });
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
        this.logger.warn("Control 'stop' for unknown session", { sessionId });
        return;
      }
      this.logger.info("Control 'stop' — closing Grok WebSocket", { sessionId });
      session.isActive = false;
      try {
        session.wsClient.close();
      } catch (err: any) {
        this.logger.warn("Error closing Grok WS on stop", { sessionId, error: err?.message });
      }
    }
  }

  unregisterSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.delete(sessionId);
      this.logger.info("Grok audio session unregistered", { sessionId });
    }
  }
}
