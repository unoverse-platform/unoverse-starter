# @gravity-platform/elevenlabs

## 1.1.0

### Minor Changes

- ElevenLabs moves out of `ingest` into its own `@gravity-platform/elevenlabs` package, and gains three new nodes.

  - **ElevenLabs TTS** — generalized to any voice via `voiceId` + model/format selection. Keeps a backward-compatible path: labelled `[DETECTIVE]:/[SUSPECT]:/[NARRATOR]:` scripts still route through the original voice-pool dialogue behavior (node type `ElevenLabs` and credential type `elevenlabsCredential` unchanged, so existing workflows keep working).
  - **ElevenLabs Dialogue** — multi-speaker scripts with explicit per-line voices via `/v1/text-to-dialogue`.
  - **ElevenLabs Sound Effects** — text prompt → sound effect clip via `/v1/sound-generation`.
  - **ElevenLabs Speech to Text** — audio/video → transcript via `/v1/speech-to-text` (Scribe), with optional diarization and word timings.
  - **ElevenLabs Music** — text prompt → original composed music track via `/v1/music`.

  `ingest` no longer registers the ElevenLabs node or credential.
