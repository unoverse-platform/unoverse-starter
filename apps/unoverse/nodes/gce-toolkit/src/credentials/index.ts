/**
 * Gemini API Credentials
 */

export const GeminiCredential = {
  name: "geminiCredential",
  displayName: "Google Gemini",
  description: "Credentials for Google Gemini API",
  properties: [
    {
      name: "apiKey",
      displayName: "API Key",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your Google Gemini API key",
      placeholder: "AIza..."
    }
  ]
};
