/**
 * Credential definitions for the search package.
 * One key (searchapiCredential) authenticates every SearchAPI.io engine.
 */

export const SearchAPICredential = {
  name: "searchapiCredential",
  displayName: "SearchAPI",
  description: "SearchAPI.io credentials — one key powers every search engine in this package",
  properties: [
    {
      name: "apiKey",
      displayName: "API Key",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your SearchAPI.io API key",
      placeholder: "Enter your SearchAPI.io API key",
    },
  ],
};
