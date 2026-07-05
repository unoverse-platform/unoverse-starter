export const MiroCredential = {
  name: "miroCredential",
  displayName: "Miro",
  description: "Credentials for Miro REST API",
  properties: [
    {
      name: "accessToken",
      displayName: "Access Token",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Miro OAuth access token",
      placeholder: "eyJtaXJvLm9yaWdpbiI6...",
    },
    {
      name: "boardId",
      displayName: "Board ID",
      type: "string" as const,
      required: true,
      description: "The Miro board ID (from the board URL)",
      placeholder: "uXjVIxxxxxx=",
    },
  ],
};
