/**
 * Event queue for Nova Speech streaming
 */

import { Subject } from "rxjs";
import { take } from "rxjs/operators";
import { firstValueFrom } from "rxjs";
import { getPlatformDependencies } from "@gravity-platform/plugin-base";

const { createLogger } = getPlatformDependencies();
const logger = createLogger("EventQueue");

/**
 * Maximum number of events allowed in the queue before we start dropping
 * the oldest audio frames to prevent unbounded growth if the Bedrock
 * consumer stalls.
 */
const MAX_QUEUE_SIZE = 500;

/**
 * Manages event queuing and streaming for Nova Speech sessions
 */
export class EventQueue {
  private queue: any[] = [];
  private queueSignal = new Subject<void>();
  private closeSignal = new Subject<void>();
  private isActive = true;
  private droppedCount = 0;
  private audioFrameRun = { count: 0, bytes: 0 };

  constructor(private sessionId: string) {}

  /**
   * Adds an event to the queue.
   *
   * - If the queue is closed, silently drops the event instead of throwing,
   *   so late-arriving audio frames from the WebSocket don't crash handlers.
   * - If the queue is at MAX_QUEUE_SIZE, drops the oldest audioInput event
   *   (preserving control/session events) to cap memory usage.
   */
  enqueue(event: any): void {
    if (!this.isActive) {
      return;
    }

    if (this.queue.length >= MAX_QUEUE_SIZE) {
      const dropIdx = this.queue.findIndex((e) => e?.event?.audioInput);
      if (dropIdx >= 0) {
        this.queue.splice(dropIdx, 1);
        this.droppedCount++;
        if (this.droppedCount % 50 === 1) {
          logger.warn("EventQueue full - dropping oldest audioInput events", {
            sessionId: this.sessionId,
            queueSize: this.queue.length,
            droppedCount: this.droppedCount,
          });
        }
      } else {
        // All control events - refuse to grow further
        logger.warn("EventQueue full of control events - refusing enqueue", {
          sessionId: this.sessionId,
          queueSize: this.queue.length,
        });
        return;
      }
    }

    this.queue.push(event);
    this.queueSignal.next();
  }

  /**
   * Makes the queue iterable for streaming
   */
  [Symbol.asyncIterator]() {
    return this.streamEvents();
  }

  /**
   * Streams events from the queue
   */
  async *streamEvents() {
    logger.debug("Starting stream", { sessionId: this.sessionId });
    try {
      while (this.isActive || this.queue.length > 0) {
        // Wait for events if queue is empty
        if (this.queue.length === 0 && this.isActive) {
          try {
            await Promise.race([
              firstValueFrom(this.queueSignal.pipe(take(1))).catch((error) => {
                // Handle EmptyError when queueSignal completes without emitting
                if (error && error.constructor.name === "EmptyError") {
                  throw new Error("Stream closed");
                }
                throw error;
              }),
              firstValueFrom(this.closeSignal.pipe(take(1))).catch((error) => {
                // Handle EmptyError when closeSignal completes without emitting
                if (error && error.constructor.name === "EmptyError") {
                  throw new Error("Stream closed");
                }
                throw error;
              }),
            ]);
          } catch (error) {
            if (error instanceof Error && error.message === "Stream closed") {
              break;
            }
            throw error;
          }
        }

        // Process events in queue
        if (this.queue.length > 0) {
          const event = this.queue.shift();
          if (event) {
            // Convert event to JSON and encode as UTF-8 bytes
            const eventJson = JSON.stringify(event);
            const textEncoder = new TextEncoder();

            // Log every non-audio event individually; aggregate audioInput
            // frames into a single summary line when a non-audio event
            // follows. Avoids ~30 log lines/sec during active capture.
            const eventType = Object.keys(event?.event || {})[0] || "unknown";
            if (eventType === "audioInput") {
              this.audioFrameRun.count++;
              this.audioFrameRun.bytes += eventJson.length;
            } else {
              if (this.audioFrameRun.count > 0) {
                logger.info("Yielded audioInput run", {
                  sessionId: this.sessionId,
                  frames: this.audioFrameRun.count,
                  totalBytes: this.audioFrameRun.bytes,
                });
                this.audioFrameRun.count = 0;
                this.audioFrameRun.bytes = 0;
              }
              logger.info("Yielding event", {
                sessionId: this.sessionId,
                eventType,
                bytes: eventJson.length,
              });
            }

            // Match the exact format from the working example
            yield {
              chunk: {
                bytes: textEncoder.encode(eventJson),
              },
            };

            // No delay between events
          }
        }

        // Only exit if queue is closed (not just empty)
        // We need to keep the stream open even with empty queue to allow for response-triggered events
        if (!this.isActive && this.queue.length === 0) {
          break;
        }
      }
    } catch (error) {
      // Catch any EmptyError that might escape
      if (error && error.constructor.name === "EmptyError") {
        // Gracefully exit on EmptyError
        return;
      }
      throw error;
    } finally {
      // Flush any pending audioInput run so its count isn't lost on close
      if (this.audioFrameRun.count > 0) {
        logger.info("Yielded audioInput run (final)", {
          sessionId: this.sessionId,
          frames: this.audioFrameRun.count,
          totalBytes: this.audioFrameRun.bytes,
        });
        this.audioFrameRun.count = 0;
        this.audioFrameRun.bytes = 0;
      }
    }
  }

  /**
   * Waits for the queue to be empty
   */
  async waitForEmpty(): Promise<void> {
    while (this.queue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  /**
   * Closes the queue
   */
  close(): void {
    this.isActive = false;
    this.closeSignal.next();
    this.closeSignal.complete();
    this.queueSignal.complete();
  }

  /**
   * Gets the current queue length
   */
  get length(): number {
    return this.queue.length;
  }

  /**
   * Checks if the queue is active
   */
  get active(): boolean {
    return this.isActive;
  }
}
