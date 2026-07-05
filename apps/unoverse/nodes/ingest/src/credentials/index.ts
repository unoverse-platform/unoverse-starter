/**
 * Credential definitions for ingest package
 * Following the package specification pattern
 */

// NOTE: SearchAPICredential moved to the @unoverse-platform/search package.
// NOTE: ApifyCredential and HyperbrowserCredential moved to the @unoverse-platform/crawl package.

// Google API Credential for Google Sheets
export const GoogleAPICredential = {
  name: "googleApiCredential",
  displayName: "Google API",
  description: "Google API credentials for accessing Google services",
  properties: [
    {
      name: "apiKey",
      displayName: "API Key",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your Google API key with Sheets API enabled",
      placeholder: "Enter your Google API key",
    },
  ],
};

// Plaid Credential for banking data
export const PlaidCredential = {
  name: "plaidCredential",
  displayName: "Plaid",
  description: "Plaid API credentials for accessing banking data (Sandbox/Development/Production)",
  properties: [
    {
      name: "clientId",
      displayName: "Client ID",
      type: "string" as const,
      required: true,
      secret: false,
      description: "Your Plaid client ID from the Plaid Dashboard",
      placeholder: "Enter your Plaid client ID",
    },
    {
      name: "secret",
      displayName: "Secret",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your Plaid secret key (use Sandbox secret for testing)",
      placeholder: "Enter your Plaid secret",
    },
    {
      name: "environment",
      displayName: "Environment",
      type: "string" as const,
      required: false,
      secret: false,
      description: "Plaid environment: sandbox, development, or production",
      placeholder: "sandbox",
      default: "sandbox",
    },
  ],
};

// Abyssale Credential for template rendering
export const AbyssaleCredential = {
  name: "abyssaleCredential",
  displayName: "Abyssale",
  description: "Abyssale API credentials for high-quality template rendering",
  properties: [
    {
      name: "apiKey",
      displayName: "API Key",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your Abyssale API key from the dashboard",
      placeholder: "Enter your Abyssale API key",
    },
  ],
};

// Airtable Credential
export const AirtableCredential = {
  name: "airtableCredential",
  displayName: "Airtable",
  description: "Airtable Personal Access Token for reading and writing to Airtable bases",
  properties: [
    {
      name: "personalAccessToken",
      displayName: "Personal Access Token",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Your Airtable Personal Access Token (create at airtable.com/create/tokens)",
      placeholder: "patXXXXXXXXXXXXXX",
    },
  ],
};

// NOTE: ApolloCredential and HunterCredential moved to the @unoverse-platform/gtm package.
// NOTE: ElevenLabsCredential moved to the @unoverse-platform/elevenlabs package
// (credential type "elevenlabsCredential" unchanged).
