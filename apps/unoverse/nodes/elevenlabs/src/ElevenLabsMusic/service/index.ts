/**
 * ElevenLabs Music service — text prompt → composed music track.
 * POST /v1/music (returns binary audio).
 *
 * Prompt mode only (the common case). The endpoint also supports a structured
 * `composition_plan` instead of a prompt; not exposed here — start lean.
 */

import { postForAudio, toBase64 } from "../../shared/elevenLabsClient";

const DEFAULT_MODEL = "music_v1";
const MIN_LENGTH_MS = 3000;
const MAX_LENGTH_MS = 600000;

export interface ElevenLabsMusicConfig {
  prompt: string;
  /** Track length in seconds (3–600). Omitted → the model picks a length. */
  lengthSeconds?: number;
  modelId?: string;
  /** Force a purely instrumental track (no vocals). */
  forceInstrumental?: boolean;
  outputFormat?: string;
}

export async function composeMusic(
  config: ElevenLabsMusicConfig,
  apiKey: string,
): Promise<{ audioBase64: string; contentType: string; format: string }> {
  const prompt = (config.prompt || "").trim();
  if (!prompt) {
    throw new Error("ElevenLabs Music: `prompt` is required (describe the music to compose).");
  }

  const body: Record<string, any> = {
    prompt,
    model_id: config.modelId || DEFAULT_MODEL,
  };
  if (typeof config.lengthSeconds === "number") {
    body.music_length_ms = Math.max(MIN_LENGTH_MS, Math.min(MAX_LENGTH_MS, Math.round(config.lengthSeconds * 1000)));
  }
  if (config.forceInstrumental) body.force_instrumental = true;

  // output_format is a QUERY param on /v1/music (not a body field) — same as the
  // TTS and sound-effects endpoints in this package.
  const audioBuffer = await postForAudio(
    "/music",
    apiKey,
    body,
    config.outputFormat ? { output_format: config.outputFormat } : undefined,
  );

  return { audioBase64: toBase64(audioBuffer), contentType: "audio/mpeg", format: "mp3" };
}
