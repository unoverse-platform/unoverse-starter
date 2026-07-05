import { getPlatformDependencies } from "@unoverse-platform/plugin-base";

// Module-level platform calls cause startup freezes (docs-starter/nodes/CLAUDE.md
// rule 5) — resolve the logger lazily instead
function getLogger() {
  return getPlatformDependencies().createLogger("RealtimeTextAccumulator");
}

export class TextAccumulator {
  private transcription = "";
  private assistantResponse = "";
  private allTurns: Array<{ query: string; response: string }> = [];
  private progressLog = "";
  private readonly logger = getLogger();

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

  emitProgress(text: string): void {
    this.progressLog += text;
    this.emit?.({ __outputs: { progress: this.progressLog } });
  }

  emitConversation(): void {
    this.logger.debug("Turn complete", {
      sessionId: this.sessionId,
      queryLength: this.transcription.length,
      responseLength: this.assistantResponse.length,
    });
    if (this.transcription || this.assistantResponse) {
      this.allTurns.push({ query: this.transcription, response: this.assistantResponse });
      const turnNum = this.allTurns.length;
      const q = this.transcription ? `Q${turnNum}: ${this.transcription}\n` : "";
      const a = this.assistantResponse ? `A${turnNum}: ${this.assistantResponse}\n` : "";
      this.emitProgress(q + a);
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
}
