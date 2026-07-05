import { StreamUsageStats } from "../../api/types";

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

  setUsage(inputTokens: number, outputTokens: number): void {
    this.stats.inputTokens = inputTokens;
    this.stats.outputTokens = outputTokens;
    this.stats.total_tokens = inputTokens + outputTokens;
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
