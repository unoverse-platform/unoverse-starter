/**
 * Credential definitions for the GTM package (Apollo.io + Hunter.io)
 */

// Apollo.io Credential for people and organisation search/enrichment
export const ApolloCredential = {
  name: "apolloCredential",
  displayName: "Apollo.io",
  description: "Apollo.io master API key for people and organisation search",
  properties: [
    {
      name: "apiKey",
      displayName: "API Key",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your Apollo.io master API key (required for search endpoints)",
      placeholder: "Enter your Apollo.io API key",
    },
  ],
};

// Hunter.io Credential for email discovery, verification and enrichment
export const HunterCredential = {
  name: "hunterCredential",
  displayName: "Hunter.io",
  description: "Hunter.io API key for email discovery, verification and enrichment",
  properties: [
    {
      name: "apiKey",
      displayName: "API Key",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your Hunter.io API key (found under API in your Hunter dashboard)",
      placeholder: "Enter your Hunter.io API key",
    },
  ],
};
