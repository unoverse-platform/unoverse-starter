/**
 * ElevenLabs TTS types.
 *
 * General single-voice text-to-speech, plus a backward-compatible path for
 * detective/suspect/narrator dialogue scripts (see service for details).
 */

export interface ElevenLabsConfig {
  /** Text to speak, or a multi-speaker script using [DETECTIVE]:/[SUSPECT]:/[NARRATOR]: labels (compat). */
  text: string;
  /** Explicit ElevenLabs voice ID. Takes precedence; blank falls back to defaults / dialogue routing. */
  voiceId?: string;
  /** Model to use (default: eleven_v3). */
  modelId?: string;
  /** Stability: 0.0 Creative | 0.5 Natural | 1.0 Robust. */
  stability?: number;
  /** Audio codec + bitrate, e.g. mp3_44100_128 (default ElevenLabs codec if omitted). */
  outputFormat?: string;
  /** COMPAT: character ID used to deterministically pick a suspect voice from a pool. */
  characterId?: string;
  /** COMPAT: 'male' | 'female' — routes a suspect to the correct voice pool. */
  characterGender?: string;
}

export interface GeneratedAudio {
  data: string; // base64-encoded audio
  mimeType: string;
  fileName: string;
}

export interface ElevenLabsOutput {
  __outputs: {
    audio: GeneratedAudio;
    metadata: {
      format: string;
      durationSeconds: number;
      characterCount: number;
      isDialogue: boolean;
      voiceId?: string;
    };
  };
}

export interface DialogueSegment {
  speaker: "DETECTIVE" | "SUSPECT" | "NARRATOR";
  text: string;
}
