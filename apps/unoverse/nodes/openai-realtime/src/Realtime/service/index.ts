import { SessionOrchestrator } from "./core/orchestration/SessionOrchestrator";
import { OpenAIRealtimeConfig, StreamUsageStats, StreamingMetadata } from "../../util/types";

export class RealtimeVoiceService {
  private orchestrator = new SessionOrchestrator();

  async generateVoiceStream(
    config: OpenAIRealtimeConfig,
    metadata: StreamingMetadata,
    context: any,
    emit?: (output: any) => void
  ): Promise<StreamUsageStats> {
    return this.orchestrator.orchestrateSession(config, metadata, context, emit);
  }
}

export type { OpenAIRealtimeConfig, StreamUsageStats, StreamingMetadata };
