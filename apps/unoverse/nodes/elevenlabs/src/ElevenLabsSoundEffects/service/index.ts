/**
 * ElevenLabs Sound Effects service — text prompt → sound effect clip.
 * POST /v1/sound-generation (returns binary MP3).
 */

import { postForAudio, toBase64 } from "../../shared/elevenLabsClient";

export interface ElevenLabsSoundEffectsConfig {
  text: string;
  /** Clip length in seconds (0.5–30). Omitted → model estimates the optimal length. */
  durationSeconds?: number;
  /** 0–1: how strictly to follow the prompt (default 0.3). */
  promptInfluence?: number;
  /** Loop-friendly output (v2 model only). */
  loop?: boolean;
  outputFormat?: string;
}

export async function generateSoundEffect(
  config: ElevenLabsSoundEffectsConfig,
  apiKey: string,
): Promise<{ audioBase64: string; contentType: string; format: string }> {
  const text = (config.text || "").trim();
  if (!text) {
    throw new Error("ElevenLabs Sound Effects: `text` prompt is required.");
  }

  const body: Record<string, any> = { text };
  if (typeof config.durationSeconds === "number") {
    // Clamp to the API's supported range.
    body.duration_seconds = Math.max(0.5, Math.min(30, config.durationSeconds));
  }
  if (typeof config.promptInfluence === "number") {
    body.prompt_influence = Math.max(0, Math.min(1, config.promptInfluence));
  }
  if (config.loop) body.loop = true;

  const audioBuffer = await postForAudio(
    "/sound-generation",
    apiKey,
    body,
    config.outputFormat ? { output_format: config.outputFormat } : undefined,
  );

  return { audioBase64: toBase64(audioBuffer), contentType: "audio/mpeg", format: "mp3" };
}
