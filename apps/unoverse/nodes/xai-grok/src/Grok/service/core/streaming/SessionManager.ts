import { randomUUID } from "crypto";
import { getPlatformDependencies } from "@gravity-platform/plugin-base";
import { WsClient } from "./WsClient";
import { StreamingMetadata, XAIGrokVoiceConfig } from "../../api/types";

function getLogger() {
  return getPlatformDependencies().createLogger("GrokSessionManager");
}

export interface GrokResponseProcessor {
  processEvent(event: any): Promise<void>;
  getUsageStats(): any;
  cleanup(): void;
  handleError(error: any): Promise<void>;
}

export interface GrokSession {
  sessionId: string;
  isActive: boolean;
  wsClient: WsClient;
  responseProcessor: GrokResponseProcessor;
}

export class SessionManager {
  private sessions = new Map<string, GrokSession>();

  createSession(
    _config: XAIGrokVoiceConfig,
    metadata: StreamingMetadata,
    responseProcessor: GrokResponseProcessor,
    wsClient: WsClient
  ): GrokSession {
    const sessionId = metadata.workflowId || randomUUID();

    const session: GrokSession = {
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
