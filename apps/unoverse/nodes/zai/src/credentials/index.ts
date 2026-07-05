/**
 * Z.AI credential — API key for the GLM (Z.AI) chat-completions API.
 *
 * Field name `apiKey` matches the platform's credential-by-signature scan, and the
 * credential is selected name-first via `available.zaiApiKey` in the service layer.
 */
export const ZAICredential = {
  name: "zaiApiKey",
  displayName: "Z.AI API",
  description: "API key for Z.AI (GLM models). Get one at https://z.ai",
  properties: [
    {
      name: "apiKey",
      displayName: "API Key",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your Z.AI API key",
    },
    {
      name: "baseUrl",
      displayName: "Base URL",
      type: "string" as const,
      required: false,
      secret: false,
      description: "Override the API base URL (default: https://api.z.ai/api/paas/v4)",
    },
  ],
};
