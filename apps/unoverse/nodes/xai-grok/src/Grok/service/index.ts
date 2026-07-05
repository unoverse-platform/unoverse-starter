import { SessionOrchestrator } from "./core/orchestration/SessionOrchestrator";
import { XAIGrokVoiceConfig, StreamUsageStats, StreamingMetadata } from "./api/types";

export class GrokVoiceService {
  private orchestrator = new SessionOrchestrator();

  async generateVoiceStream(
    config: XAIGrokVoiceConfig,
    metadata: StreamingMetadata,
    context: any,
    emit?: (output: any) => void
  ): Promise<StreamUsageStats> {
    return this.orchestrator.orchestrateSession(config, metadata, context, emit);
  }
}

export type { XAIGrokVoiceConfig, StreamUsageStats, StreamingMetadata };
