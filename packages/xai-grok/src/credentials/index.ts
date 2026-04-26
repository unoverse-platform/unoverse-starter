export const XAICredential = {
  name: "xaiCredential",
  displayName: "xAI",
  description: "Credentials for xAI Grok API",
  properties: [
    {
      name: "apiKey",
      displayName: "API Key",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your xAI API key",
      placeholder: "xai-...",
    },
  ],
};
