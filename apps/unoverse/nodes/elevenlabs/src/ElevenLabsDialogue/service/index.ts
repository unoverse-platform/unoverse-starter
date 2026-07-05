/**
 * ElevenLabs Dialogue service — general multi-speaker synthesis.
 *
 * Renders an ordered list of lines, each in its own voice, to one continuous
 * audio track via /v1/text-to-dialogue. Each line resolves a voice either
 * directly (`voiceId`) or by `speaker` through an optional speaker→voice map.
 */

import { postForAudio, toBase64 } from "../../shared/elevenLabsClient";

const DEFAULT_MODEL = "eleven_v3";

export interface DialogueLine {
  text: string;
  voiceId?: string;
  speaker?: string;
}

export interface ElevenLabsDialogueConfig {
  lines: DialogueLine[];
  /** Optional speaker-name → voiceId map, used when a line has no explicit voiceId. */
  voiceMap?: Record<string, string>;
  modelId?: string;
  stability?: number;
}

function normalizeStability(value: number | undefined): number {
  return [0.0, 0.5, 1.0].includes(value ?? -1) ? (value as number) : 0.5;
}

export async function generateDialogue(
  config: ElevenLabsDialogueConfig,
  apiKey: string,
): Promise<{ audioBase64: string; contentType: string; format: string; segments: number; characterCount: number }> {
  const lines = Array.isArray(config.lines) ? config.lines : [];
  if (lines.length === 0) {
    throw new Error("ElevenLabs Dialogue: `lines` is empty — provide an array of { text, voiceId } items.");
  }

  const voiceMap = config.voiceMap || {};
  const inputs = lines.map((line, i) => {
    const voiceId = line.voiceId?.trim() || (line.speaker ? voiceMap[line.speaker] : undefined);
    if (!voiceId) {
      throw new Error(
        `ElevenLabs Dialogue: line ${i} ("${(line.text || "").slice(0, 30)}…") has no voice — set its voiceId or map its speaker "${line.speaker ?? ""}" in voiceMap.`,
      );
    }
    return { text: String(line.text ?? "").trim(), voice_id: voiceId };
  });

  const audioBuffer = await postForAudio("/text-to-dialogue", apiKey, {
    inputs,
    model_id: config.modelId || DEFAULT_MODEL,
    settings: { stability: normalizeStability(config.stability) },
  });

  const characterCount = inputs.reduce((n, i) => n + i.text.length, 0);

  return {
    audioBase64: toBase64(audioBuffer),
    contentType: "audio/mpeg",
    format: "mp3",
    segments: inputs.length,
    characterCount,
  };
}
