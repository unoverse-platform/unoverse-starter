import { WsClient } from "./WsClient";

/**
 * Singleton registry that maps conversationId → live WsClient.
 * Needed because END_CALL arrives as a new executor invocation
 * with no memory of the WsClient created during START_CALL.
 */
class GrokSessionRegistry {
  private clients = new Map<string, WsClient>();
  private static _instance: GrokSessionRegistry;

  static get instance(): GrokSessionRegistry {
    if (!GrokSessionRegistry._instance) {
      GrokSessionRegistry._instance = new GrokSessionRegistry();
    }
    return GrokSessionRegistry._instance;
  }

  register(conversationId: string, client: WsClient): void {
    this.clients.set(conversationId, client);
  }

  get(conversationId: string): WsClient | undefined {
    return this.clients.get(conversationId);
  }

  remove(conversationId: string): void {
    this.clients.delete(conversationId);
  }
}

export const grokSessionRegistry = GrokSessionRegistry.instance;
