import WebSocket from "ws";
import { getPlatformDependencies } from "@gravity-platform/plugin-base";
import { GROK_WS_URL } from "../../../constants";

const { createLogger } = getPlatformDependencies();

export class WsClient {
  private ws: WebSocket | null = null;
  private messageHandler: ((event: any) => void) | null = null;
  private readonly logger = createLogger("WsClient");

  async connect(apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(GROK_WS_URL, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      this.ws.once("open", () => {
        this.logger.info("xAI Grok WebSocket connected");
        resolve();
      });

      this.ws.once("error", (err) => {
        this.logger.error("WebSocket connection error", { error: err.message });
        reject(err);
      });

      this.ws.on("message", (data) => {
        try {
          const event = JSON.parse(data.toString());
          if (this.messageHandler) {
            this.messageHandler(event);
          }
        } catch (err) {
          this.logger.error("Failed to parse message", { error: err });
        }
      });

      this.ws.on("close", (code, reason) => {
        this.logger.info("WebSocket closed", { code, reason: reason.toString() });
      });
    });
  }

  send(event: Record<string, unknown>): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn("Cannot send — WebSocket not open");
      return;
    }
    this.ws.send(JSON.stringify(event));
  }

  onMessage(handler: (event: any) => void): void {
    this.messageHandler = handler;
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  waitForClose(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.ws) {
        this.logger.warn("waitForClose: ws is null — resolving immediately");
        resolve();
        return;
      }
      if (!this.isOpen) {
        this.logger.warn(`waitForClose: ws not open (readyState=${this.ws.readyState}) — resolving immediately`);
        resolve();
        return;
      }
      this.logger.info("waitForClose: ws is OPEN — waiting for close event...");
      this.ws.once("close", () => {
        this.logger.info("waitForClose: close event received — resolving");
        resolve();
      });
    });
  }

  get isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
