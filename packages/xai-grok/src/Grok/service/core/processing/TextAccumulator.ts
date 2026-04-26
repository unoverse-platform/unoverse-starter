import { getPlatformDependencies } from "@gravity-platform/plugin-base";

const { createLogger } = getPlatformDependencies();

export class TextAccumulator {
  private transcription = "";
  private assistantResponse = "";
  private allTurns: Array<{ query: string; response: string }> = [];
  private readonly logger = createLogger("GrokTextAccumulator");

  constructor(
    private sessionId: string,
    private emit?: (output: any) => void,
  ) {}

  appendAssistant(text: string): void {
    this.assistantResponse += text;
  }

  setAssistantText(text: string): void {
    this.assistantResponse = text;
  }

  setUserTranscript(transcript: string): void {
    this.transcription = transcript;
  }

  emitConversation(): void {
    // Accumulate turns — don't emit mid-session as it triggers workflow completion
    this.logger.debug("Turn complete (accumulated, not emitted)", {
      sessionId: this.sessionId,
      queryLength: this.transcription.length,
      responseLength: this.assistantResponse.length,
    });
    if (this.transcription || this.assistantResponse) {
      this.allTurns.push({ query: this.transcription, response: this.assistantResponse });
    }
  }

  emitFinal(): void {
    if (!this.emit || this.allTurns.length === 0) return;
    const lastTurn = this.allTurns[this.allTurns.length - 1];
    this.logger.info("Emitting final conversation", {
      sessionId: this.sessionId,
      turns: this.allTurns.length,
    });
    this.emit({
      __outputs: {
        text: {
          query: lastTurn.query,
          response: lastTurn.response,
        },
      },
    });
  }

  resetTurn(): void {
    this.transcription = "";
    this.assistantResponse = "";
  }

  getTranscription(): string {
    return this.transcription;
  }
  getAssistantResponse(): string {
    return this.assistantResponse;
  }
  getFullTextOutput(): string {
    return this.transcription + this.assistantResponse;
  }
}
