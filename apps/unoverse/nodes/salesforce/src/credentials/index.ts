export const SalesforceCredential = {
  name: "salesforceOAuth",
  displayName: "Salesforce",
  description:
    "Salesforce connected app (OAuth2 client credentials). The node exchanges these for short-lived access tokens at runtime — acts as a single integration/service-account identity.",
  properties: [
    {
      name: "host",
      displayName: "Login / My Domain URL",
      type: "string" as const,
      required: true,
      secret: false,
      description:
        "Your Salesforce My Domain or login URL — used for the OAuth token endpoint",
      placeholder: "https://your-org.my.salesforce.com",
    },
    {
      name: "clientId",
      displayName: "Consumer Key (Client ID)",
      type: "string" as const,
      required: true,
      secret: false,
      description: "Connected app Consumer Key",
      placeholder: "3MVG9...",
    },
    {
      name: "clientSecret",
      displayName: "Consumer Secret (Client Secret)",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Connected app Consumer Secret",
      placeholder: "••••••••",
    },
    {
      name: "apiVersion",
      displayName: "API Version",
      type: "string" as const,
      required: false,
      secret: false,
      description: "Salesforce REST API version (defaults to v52.0)",
      placeholder: "v52.0",
    },
  ],
};
