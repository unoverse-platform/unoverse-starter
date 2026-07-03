import { StreamUsageStats } from "../../../../util/types";

export class UsageStatsCollector {
  private stats: StreamUsageStats = {
    estimated: false,
    total_tokens: 0,
    inputTokens: 0,
    outputTokens: 0,
    chunk_count: 0,
    textOutput: "",
    transcription: "",
    assistantResponse: "",
  };

  incrementChunkCount(): void {
    this.stats.chunk_count++;
  }

  /**
   * Accumulate per-response usage. OpenAI bills each response with its own
   * input tokens (including context), so summing across the session's turns is
   * the accurate total — overwriting would record only the final turn.
   */
  addUsage(inputTokens: number, outputTokens: number): void {
    this.stats.inputTokens += inputTokens;
    this.stats.outputTokens += outputTokens;
    this.stats.total_tokens = this.stats.inputTokens + this.stats.outputTokens;
    this.stats.estimated = false;
  }

  setTextResults(transcription: string, assistantResponse: string): void {
    this.stats.transcription = transcription;
    this.stats.assistantResponse = assistantResponse;
    this.stats.textOutput = transcription + assistantResponse;
  }

  getUsageStats(): StreamUsageStats {
    return { ...this.stats };
  }

  reset(): void {
    this.stats = {
      estimated: false,
      total_tokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      chunk_count: 0,
      textOutput: "",
      transcription: "",
      assistantResponse: "",
    };
  }
}
