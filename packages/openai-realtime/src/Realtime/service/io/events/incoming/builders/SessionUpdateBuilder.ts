import { OpenAIRealtimeConfig } from "../../../../../../util/types";
import { REALTIME_MODEL_ID } from "../../../../../constants";

const VALID_VOICES = new Set(["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse", "marin", "cedar"]);

function normalizeVoice(input?: string): string {
  if (!input) return "alloy";
  const lower = input.toLowerCase();
  return VALID_VOICES.has(lower) ? lower : "alloy";
}

export class SessionUpdateBuilder {
  static build(config: OpenAIRealtimeConfig): Record<string, unknown> {
    const turnDetection =
      config.turnDetection === "disabled"
        ? null
        : config.turnDetection === "server_vad"
          ? {
              type: "server_vad" as const,
              create_response: true,
              interrupt_response: true,
              silence_duration_ms: 700,
              prefix_padding_ms: 300,
              threshold: 0.7,
            }
          : {
              type: "semantic_vad" as const,
              create_response: true,
              interrupt_response: true,
              eagerness: "high",
            };

    const session: Record<string, unknown> = {
      type: "realtime",
      model: REALTIME_MODEL_ID,
      output_modalities: ["audio"],
      audio: {
        input: {
          format: { type: "audio/pcm", rate: 24000 },
          noise_reduction: { type: "near_field" },
          transcription: { model: "gpt-4o-mini-transcribe" },
          turn_detection: turnDetection,
        },
        output: {
          format: { type: "audio/pcm", rate: 24000 },
          voice: normalizeVoice(config.voice),
        },
      },
    };

    if (config.systemPrompt) {
      session.instructions = config.systemPrompt;
    }

    if (config.maxResponseOutputTokens !== undefined) {
      session.max_output_tokens = config.maxResponseOutputTokens;
    }

    if (config.tools && config.tools.length > 0) {
      session.tools = config.tools;
      session.tool_choice = "auto";
    }

    return { type: "session.update", session };
  }
}
