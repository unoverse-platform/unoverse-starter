import WebSocket from "ws";
import { getPlatformDependencies } from "@unoverse-platform/plugin-base";
import { REALTIME_WS_URL, REALTIME_MODEL_ID } from "../../../constants";

function getLogger() {
  return getPlatformDependencies().createLogger("RealtimeWsClient");
}

export class WsClient {
  private ws: WebSocket | null = null;
  private logger = getLogger();
  private messageHandler: ((event: any) => void) | null = null;

  async connect(apiKey: string): Promise<void> {
    const url = `${REALTIME_WS_URL}?model=${REALTIME_MODEL_ID}`;

    this.ws = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return new Promise((resolve, reject) => {
      if (!this.ws) return reject(new Error("WebSocket not initialized"));

      let settled = false;

      this.ws.once("open", () => {
        settled = true;
        this.logger.info("OpenAI Realtime WebSocket connected");
        resolve();
      });

      // Persistent handler: an unhandled 'error' event on the socket would crash
      // the process. Rejects the connect promise only during the connection phase.
      this.ws.on("error", (err) => {
        this.logger.error("WebSocket error", { error: err.message });
        if (!settled) {
          settled = true;
          reject(err);
        }
      });

      this.ws.on("message", (data: WebSocket.Data) => {
        try {
          const event = JSON.parse(data.toString());
          if (this.messageHandler) {
            this.messageHandler(event);
          }
        } catch (err: any) {
          this.logger.error("Failed to parse WebSocket message", { error: err.message });
        }
      });

      this.ws.on("close", (code, reason) => {
        this.logger.info("OpenAI Realtime WebSocket closed", { code, reason: reason.toString() });
      });
    });
  }

  send(event: any): void {
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
        resolve();
        return;
      }
      if (!this.isOpen) {
        resolve();
        return;
      }
      this.ws.once("close", () => resolve());
    });
  }

  get isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
