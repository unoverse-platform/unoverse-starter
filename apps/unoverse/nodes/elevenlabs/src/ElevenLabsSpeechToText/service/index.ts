/**
 * ElevenLabs Speech-to-Text service — audio/video → transcript.
 * POST /v1/speech-to-text (multipart/form-data).
 *
 * Accepts either a `source_url` the API fetches itself, or inline base64 audio
 * uploaded as a file part.
 */

import { postMultipart } from "../../shared/elevenLabsClient";

const DEFAULT_MODEL = "scribe_v1";

export interface ElevenLabsSpeechToTextConfig {
  /** URL of an audio/video file for the API to fetch and transcribe. */
  audioUrl?: string;
  /** Inline base64 audio (alternative to audioUrl). */
  audioBase64?: string;
  /** MIME type for inline audio (default audio/mpeg). */
  mimeType?: string;
  modelId?: string;
  /** ISO language code; omit to auto-detect. */
  languageCode?: string;
  /** Annotate distinct speakers in the word list. */
  diarize?: boolean;
  /** Tag non-speech audio events ([laughter], [music], …). */
  tagAudioEvents?: boolean;
}

export interface TranscriptWord {
  text: string;
  start?: number;
  end?: number;
  type?: string;
  speaker_id?: string;
}

export interface SpeechToTextResult {
  text: string;
  languageCode?: string;
  languageProbability?: number;
  words: TranscriptWord[];
}

export async function transcribe(
  config: ElevenLabsSpeechToTextConfig,
  apiKey: string,
): Promise<SpeechToTextResult> {
  const form = new FormData();
  form.set("model_id", config.modelId || DEFAULT_MODEL);

  if (config.audioBase64) {
    const bytes = Buffer.from(config.audioBase64, "base64");
    const blob = new Blob([bytes], { type: config.mimeType || "audio/mpeg" });
    form.set("file", blob, "audio");
  } else if (config.audioUrl) {
    form.set("source_url", config.audioUrl.trim());
  } else {
    throw new Error("ElevenLabs Speech to Text: provide `audioUrl` or `audioBase64`.");
  }

  if (config.languageCode) form.set("language_code", config.languageCode);
  if (config.diarize) form.set("diarize", "true");
  if (config.tagAudioEvents) form.set("tag_audio_events", "true");

  const data = await postMultipart<any>("/speech-to-text", apiKey, form);

  return {
    text: data?.text ?? "",
    languageCode: data?.language_code,
    languageProbability: data?.language_probability,
    words: Array.isArray(data?.words) ? data.words : [],
  };
}
