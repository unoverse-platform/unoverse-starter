import { getPlatformDependencies } from "@gravity-platform/plugin-base";
import { OpenAIRealtimeConfig, StreamingMetadata } from "../../../../util/types";
import { WsClient } from "./WsClient";
import { RealtimeResponseProcessor } from "../processing/ResponseProcessor";

function getLogger() {
  return getPlatformDependencies().createLogger("RealtimeSessionManager");
}

export interface RealtimeSession {
  sessionId: string;
  isActive: boolean;
  wsClient: WsClient;
  responseProcessor: RealtimeResponseProcessor;
}

export class SessionManager {
  private sessions = new Map<string, RealtimeSession>();

  createSession(
    _config: OpenAIRealtimeConfig,
    metadata: StreamingMetadata,
    responseProcessor: RealtimeResponseProcessor,
    wsClient: WsClient,
  ): RealtimeSession {
    const sessionId = metadata.workflowId || `session_${Date.now()}`;

    const session: RealtimeSession = {
      sessionId,
      isActive: true,
      wsClient,
      responseProcessor,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      session.responseProcessor.cleanup();
      this.sessions.delete(sessionId);
      getLogger().info("Session ended", { sessionId });
    }
  }
}
