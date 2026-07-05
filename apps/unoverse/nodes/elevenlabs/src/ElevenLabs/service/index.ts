/**
 * ElevenLabs TTS service.
 *
 * Two paths, auto-selected from the text:
 *
 *  1. GENERAL single-voice TTS — the common case. Uses `config.voiceId` (any
 *     voice from your ElevenLabs library); falls back to a default narrator
 *     voice when no voice is set.
 *
 *  2. COMPAT multi-speaker dialogue — when the text contains
 *     [DETECTIVE]:/[SUSPECT]:/[NARRATOR]: speaker labels, it routes through the
 *     original game behavior (deterministic voice pools + Text-to-Dialogue API
 *     with a sequential fallback). This preserves the MurderMystery app, which
 *     drives the node with labelled scripts + characterId/characterGender.
 *     For general multi-speaker work prefer the dedicated ElevenLabs Dialogue
 *     node, which takes explicit per-line voices.
 */

import { ElevenLabsConfig, DialogueSegment } from "../util/types";
import { ELEVENLABS_API_BASE, postForAudio, toBase64 } from "../../shared/elevenLabsClient";

const DEFAULT_MODEL = "eleven_v3";

// ── COMPAT: premade voice pools (built into every account, no creation, no limits) ──
const DETECTIVE_VOICE_ID = "pFZP5JQG7iQjIQuC4Bku"; // Female detective — the interviewer, never a suspect

const PREMADE_MALE_VOICES = [
  "onwK4e9ZLuTAKqWW03F9", // Daniel
  "N2lVS1w4EtoT3dr4eOWO", // Liam
  "IKne3meq5aSn9XLyUdCD", // Charlie
  "TX3LPaxmHKxFdv7VOQHJ", // Liam (alt)
  "JBFqnCBsd6RMkjVDRZzb", // George
  "TxGEqnHWrfWFTfGW9XjX", // Josh
  "29vD33N1CtxCmqQRPOHJ", // Drew
];

const PREMADE_FEMALE_VOICES = [
  "pNInz6obpgDQGcFmaJgB", // Nicole
  "Xb7hH8MSUJpSbSDYk0k2", // Alice
  "jBpfuIE2acCO8z3wKNLl", // Freya
  "jsCqWAovK2LkecY7zXl4", // Dorothy
  "z9fAnlkpzviPz146aGWa", // Glinda
];

// Default voice for general single-speaker TTS when no voiceId is supplied.
const DEFAULT_NARRATOR_VOICE = PREMADE_MALE_VOICES[0];

function normalizeStability(value: number | undefined): number {
  return [0.0, 0.5, 1.0].includes(value ?? -1) ? (value as number) : 0.5;
}

/** djb2 hash → stable integer, for deterministic voice selection. */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return Math.abs(hash);
}

/** COMPAT: deterministic suspect voice from characterId + gender. */
function pickSuspectVoice(characterId: string, gender: string): string {
  const g = (gender || "").toLowerCase().trim();
  const isFemale = g === "female" || g === "f" || g === "woman";
  const pool = isFemale ? PREMADE_FEMALE_VOICES : PREMADE_MALE_VOICES;
  return pool[hashString(characterId) % pool.length];
}

/** Detect the labelled-dialogue compat format. */
export function isDialogueScript(text: string): boolean {
  return /\[(DETECTIVE|SUSPECT|NARRATOR)\]:/i.test(text);
}

/** Parse a labelled script into ordered speaker segments. */
export function parseDialogueScript(script: string): DialogueSegment[] {
  const segments: DialogueSegment[] = [];
  let currentSpeaker: DialogueSegment["speaker"] = "NARRATOR";
  let currentText = "";

  const flush = () => {
    if (currentText.trim()) segments.push({ speaker: currentSpeaker, text: currentText.trim() });
  };

  for (const rawLine of script.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const detective = line.match(/^\[DETECTIVE\]:\s*(.*)$/i);
    const suspect = line.match(/^\[SUSPECT\]:\s*(.*)$/i);
    const narrator = line.match(/^\[NARRATOR\]:\s*(.*)$/i);

    if (detective) {
      flush();
      currentSpeaker = "DETECTIVE";
      currentText = detective[1];
    } else if (suspect) {
      flush();
      currentSpeaker = "SUSPECT";
      currentText = suspect[1];
    } else if (narrator) {
      flush();
      currentSpeaker = "NARRATOR";
      currentText = narrator[1];
    } else {
      currentText += " " + line;
    }
  }
  flush();
  return segments;
}

function voiceForSpeaker(speaker: DialogueSegment["speaker"], config: ElevenLabsConfig): string {
  if (speaker === "DETECTIVE") return DETECTIVE_VOICE_ID;
  if (speaker === "SUSPECT") {
    return pickSuspectVoice(config.characterId || "suspect_default", config.characterGender || "male");
  }
  return DEFAULT_NARRATOR_VOICE;
}

/** Single-segment TTS via /v1/text-to-speech/{voiceId}. */
async function speak(text: string, voiceId: string, apiKey: string, config: ElevenLabsConfig): Promise<ArrayBuffer> {
  if (!text.trim()) return new ArrayBuffer(0);
  return postForAudio(
    `/text-to-speech/${voiceId}`,
    apiKey,
    {
      text: text.trim(),
      model_id: config.modelId || DEFAULT_MODEL,
      voice_settings: { stability: normalizeStability(config.stability) },
    },
    config.outputFormat ? { output_format: config.outputFormat } : undefined,
  );
}

/** COMPAT: multi-speaker via /v1/text-to-dialogue (throws to trigger sequential fallback). */
async function speakDialogue(
  segments: DialogueSegment[],
  apiKey: string,
  config: ElevenLabsConfig,
): Promise<ArrayBuffer> {
  const inputs = segments.map((seg) => ({ text: seg.text, voice_id: voiceForSpeaker(seg.speaker, config) }));
  try {
    return await postForAudio("/text-to-dialogue", apiKey, {
      inputs,
      model_id: config.modelId || DEFAULT_MODEL,
      settings: { stability: normalizeStability(config.stability) },
    });
  } catch {
    throw new Error("FALLBACK_TO_SEQUENTIAL");
  }
}

function concatAudio(buffers: ArrayBuffer[]): ArrayBuffer {
  const parts = buffers.filter((b) => b.byteLength > 0);
  const total = parts.reduce((n, b) => n + b.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const b of parts) {
    out.set(new Uint8Array(b), offset);
    offset += b.byteLength;
  }
  return out.buffer;
}

export async function generateTTS(
  config: ElevenLabsConfig,
  context: any,
  apiKey: string,
): Promise<{
  audioBase64: string;
  format: string;
  durationSeconds: number;
  contentType: string;
  characterCount: number;
  isDialogue: boolean;
  voiceId?: string;
}> {
  const text = config.text || "";
  const isDialogue = isDialogueScript(text);
  let audioBuffer: ArrayBuffer;
  let voiceId: string | undefined;

  if (isDialogue) {
    const segments = parseDialogueScript(text);
    try {
      audioBuffer = await speakDialogue(segments, apiKey, config);
    } catch (error: any) {
      if (error?.message?.includes("FALLBACK")) {
        // Sequential per-segment TTS, then concatenate the MP3 frames.
        const buffers: ArrayBuffer[] = [];
        for (const seg of segments) {
          buffers.push(await speak(seg.text, voiceForSpeaker(seg.speaker, config), apiKey, config));
          await new Promise((r) => setTimeout(r, 100));
        }
        audioBuffer = concatAudio(buffers);
      } else {
        throw error;
      }
    }
  } else {
    voiceId = config.voiceId?.trim() || DEFAULT_NARRATOR_VOICE;
    audioBuffer = await speak(text, voiceId, apiKey, config);
  }

  const characterCount = text.length;
  // Rough estimate: ~150 wpm, ~5 chars/word.
  const durationSeconds = Math.round((characterCount / 5 / 150) * 60);

  return {
    audioBase64: toBase64(audioBuffer),
    format: "mp3",
    durationSeconds,
    contentType: "audio/mpeg",
    characterCount,
    isDialogue,
    voiceId,
  };
}

export { ELEVENLABS_API_BASE };
