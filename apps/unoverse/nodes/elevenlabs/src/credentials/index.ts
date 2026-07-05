// ElevenLabs credential — a single API key from the ElevenLabs dashboard.
// Credential TYPE name kept as "elevenlabsCredential" (unchanged from the
// original ingest node) so existing stored credentials keep resolving after
// the node moved to this standalone package.
export const ElevenLabsCredential = {
  name: "elevenlabsCredential",
  displayName: "ElevenLabs",
  description: "ElevenLabs API credentials for text-to-speech, sound effects, and transcription",
  properties: [
    {
      name: "apiKey",
      displayName: "API Key",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your ElevenLabs API key from the dashboard (Profile → API Keys)",
      placeholder: "Enter your ElevenLabs API key",
    },
  ],
};
