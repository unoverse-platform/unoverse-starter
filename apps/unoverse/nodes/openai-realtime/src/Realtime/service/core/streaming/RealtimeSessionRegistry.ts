import { WsClient } from "./WsClient";

class RealtimeSessionRegistry {
  private sessions = new Map<string, WsClient>();

  register(conversationId: string, wsClient: WsClient): void {
    // A duplicate START_CALL must not orphan the previous session: the old
    // client would become unreachable by END_CALL and stay open (and billed)
    const existing = this.sessions.get(conversationId);
    if (existing && existing !== wsClient) {
      try {
        existing.close();
      } catch {
        /* already closed */
      }
    }
    this.sessions.set(conversationId, wsClient);
  }

  get(conversationId: string): WsClient | undefined {
    return this.sessions.get(conversationId);
  }

  remove(conversationId: string): void {
    this.sessions.delete(conversationId);
  }

  clear(): void {
    this.sessions.clear();
  }
}

export const realtimeSessionRegistry = new RealtimeSessionRegistry();
