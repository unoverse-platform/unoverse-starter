export const XCredential = {
  name: "xCredential",
  displayName: "X (Twitter)",
  description: "Credentials for X API v2",
  properties: [
    {
      name: "bearerToken",
      displayName: "Bearer Token",
      type: "string" as const,
      required: true,
      secret: true,
      description: "X API v2 Bearer Token (app-only auth)",
      placeholder: "AAAA...",
    },
  ],
};
