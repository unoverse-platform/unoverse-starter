/**
 * Text Emitter
 * Handles emitting text chunks during streaming
 */

const EMIT_INTERVAL = 100; // Emit every ~100 new chars for smoother streaming

export class TextEmitter {
  private charsSinceLastEmit: number = 0;
  private emit: (output: any) => void;
  private logger: any;

  constructor(emit: (output: any) => void, logger: any) {
    this.emit = emit;
    this.logger = logger;
  }

  /**
   * Emit text if interval threshold is reached
   */
  emitIfNeeded(fullText: string, newCharsCount: number): void {
    this.charsSinceLastEmit += newCharsCount;

    // Log every call to debug
    if (this.charsSinceLastEmit % 100 < newCharsCount) {
      this.logger.info(`📊 [TextEmitter] charsSinceLastEmit: ${this.charsSinceLastEmit}, threshold: ${EMIT_INTERVAL}`);
    }

    if (this.charsSinceLastEmit >= EMIT_INTERVAL) {
      this.logger.info(`📦 EMITTING accumulated text (${this.charsSinceLastEmit} new chars, ${fullText.length} total)`);

      this.emit({
        __outputs: {
          chunk: fullText, // Send full accumulated text
        },
      });

      this.charsSinceLastEmit = 0;
    }
  }

  /**
   * Emit final text - ALWAYS emit the complete text regardless of charsSinceLastEmit
   */
  emitFinal(fullText: string): void {
    this.logger.info(
      `📦 [emitFinal] Called with charsSinceLastEmit=${this.charsSinceLastEmit}, fullTextLength=${
        fullText?.length || 0
      }`
    );
    // ALWAYS emit final chunk with complete text
    this.emit({
      __outputs: {
        chunk: fullText, // Send complete accumulated text
      },
    });
    this.logger.info(`📦 Emitted FINAL chunk (${this.charsSinceLastEmit} pending chars, ${fullText.length} total)`);
    this.charsSinceLastEmit = 0;
  }

  /**
   * Reset the counter
   */
  reset(): void {
    this.charsSinceLastEmit = 0;
  }
}
