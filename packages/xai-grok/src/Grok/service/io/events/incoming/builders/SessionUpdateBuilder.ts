import { XAIGrokVoiceConfig } from "../../../../api/types";

const VALID_VOICES = new Set(["eve", "ara", "rex", "sal", "leo"]);

function normalizeVoice(input?: string): string {
  if (!input) return "eve";
  const lower = input.toLowerCase();
  if (VALID_VOICES.has(lower)) return lower;
  // Tolerate values like "human_Eve" by extracting the last segment.
  const last = lower.split(/[_\s-]+/).pop() || "";
  return VALID_VOICES.has(last) ? last : "eve";
}

export class SessionUpdateBuilder {
  static build(config: XAIGrokVoiceConfig): Record<string, unknown> {
    return {
      type: "session.update",
      session: {
        instructions: config.systemPrompt || "",
        voice: normalizeVoice(config.voice),
        turn_detection:
          config.turnDetection === "manual"
            ? null
            : {
                type: "server_vad",
                threshold: 0.6,
                prefix_padding_ms: 300,
                silence_duration_ms: 400,
              },
        audio: {
          input: { format: { type: "audio/pcm", rate: 16000 } },
          output: { format: { type: "audio/pcm", rate: 24000 } },
        },
        ...(config.tools && config.tools.length > 0 ? { tools: config.tools, tool_choice: "auto" } : {}),
      },
    };
  }
}
