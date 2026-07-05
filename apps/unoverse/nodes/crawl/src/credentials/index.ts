/**
 * Credential definitions for the Crawl package.
 */

// Hyperbrowser Credential for web scraping / crawling / extraction
export const HyperbrowserCredential = {
  name: "hyperbrowserCredential",
  displayName: "Hyperbrowser",
  description: "Hyperbrowser API credentials for scraping, crawling and extraction",
  properties: [
    {
      name: "apiKey",
      displayName: "API Key",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your Hyperbrowser API key from app.hyperbrowser.ai",
      placeholder: "Enter your Hyperbrowser API key",
    },
  ],
};

// Apify Credential for actor/task runs
export const ApifyCredential = {
  name: "apifyCredential",
  displayName: "Apify",
  description: "Apify API credentials for starting actor runs and fetching results",
  properties: [
    {
      name: "token",
      displayName: "API Token",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your Apify API token from console.apify.com",
      placeholder: "Enter your Apify API token",
    },
  ],
};
