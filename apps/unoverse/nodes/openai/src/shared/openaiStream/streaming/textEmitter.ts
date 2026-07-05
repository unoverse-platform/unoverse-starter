/**
 * Text Emitter
 * Handles emitting text chunks during streaming
 */

// Every emit re-executes each downstream node (engine EXECUTE → HTTP round trip →
// render + publish), so the emit rate — not the model's chunk rate — sets that cost.
// Time-based throttle: at most ~5 emits/sec regardless of how fast the model streams.
const EMIT_MIN_INTERVAL_MS = 200;

export class TextEmitter {
  private charsSinceLastEmit: number = 0;
  private lastEmitAt: number = 0;
  private emit: (output: any) => void;
  private logger: any;

  constructor(emit: (output: any) => void, logger: any) {
    this.emit = emit;
    this.logger = logger;
  }

  /**
   * Emit text if there are pending chars and the throttle interval has passed
   */
  emitIfNeeded(fullText: string, newCharsCount: number): void {
    this.charsSinceLastEmit += newCharsCount;

    if (this.charsSinceLastEmit === 0) return;
    if (Date.now() - this.lastEmitAt < EMIT_MIN_INTERVAL_MS) return;

    this.doEmit(fullText);
  }

  /**
   * Emit pending text ignoring the throttle — end of a stream iteration must not
   * leave text sitting in the buffer while tool calls run
   */
  flush(fullText: string): void {
    if (this.charsSinceLastEmit === 0) return;
    this.doEmit(fullText);
  }

  /**
   * Emit final text - ALWAYS emit the complete text regardless of pending state
   */
  emitFinal(fullText: string): void {
    this.doEmit(fullText);
  }

  private doEmit(fullText: string): void {
    this.emit({
      __outputs: {
        chunk: fullText, // Send full accumulated text
      },
    });
    this.charsSinceLastEmit = 0;
    this.lastEmitAt = Date.now();
  }

  /**
   * Reset the counter
   */
  reset(): void {
    this.charsSinceLastEmit = 0;
  }
}
