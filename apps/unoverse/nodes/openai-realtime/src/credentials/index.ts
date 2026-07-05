export const OpenAICredential = {
  name: "openaiCredential",
  displayName: "OpenAI",
  description: "Credentials for OpenAI Realtime API",
  properties: [
    {
      name: "apiKey",
      displayName: "API Key",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your OpenAI API key from platform.openai.com",
      placeholder: "sk-...",
    },
  ],
};
