import { createPlugin } from "@gravity-platform/plugin-base";

// Create and export the plugin
const plugin = createPlugin({
  name: "@gravity-platform/ingest",
  version: "1.0.0",
  description: "Data ingestion nodes for Gravity workflow system",

  async setup(api) {
    // Initialize platform dependencies
    const { initializePlatformFromAPI } = await import("@gravity-platform/plugin-base");
    initializePlatformFromAPI(api);

    // Import and register DocumentParser node
    const { DocumentParserNode } = await import("./DocumentParser/node");
    api.registerNode(DocumentParserNode);

    // Import and register Document node
    const { DocumentNode } = await import("./Document/node");
    api.registerNode(DocumentNode);

    // NOTE: SearchWeb node moved to the @gravity-platform/search package (with SearchNews/Videos/Places).
    // NOTE: Apify (Starter/Results) and Hyperbrowser nodes moved to the @gravity-platform/crawl package.

    // Import and register GoogleSheet node
    const { GoogleSheetNode } = await import("./GoogleSheet/node");
    api.registerNode(GoogleSheetNode);

    // Import and register PlaidTransactions node
    const { PlaidTransactionsNode } = await import("./PlaidTransactions/node");
    api.registerNode(PlaidTransactionsNode);

    // Import and register Abyssale node
    const { AbyssaleNode } = await import("./Abyssale/node");
    api.registerNode(AbyssaleNode);

    // NOTE: ElevenLabs (TTS) moved to the @gravity-platform/elevenlabs package
    // (now also Dialogue / Sound Effects / Speech-to-Text). Credential type
    // "elevenlabsCredential" is unchanged there, so existing creds keep resolving.

    // Import and register SpatialIngest node
    const { SpatialIngestNode } = await import("./SpatialIngest/node");
    api.registerNode(SpatialIngestNode);

    // NOTE: Apollo.io and Hunter.io nodes moved to the @gravity-platform/gtm package.

    // Import and register credentials
    // NOTE: SearchAPICredential moved to the @gravity-platform/search package.
    const {
      GoogleAPICredential,
      PlaidCredential,
      AbyssaleCredential,
    } = await import("./credentials");
    api.registerCredential(GoogleAPICredential);
    api.registerCredential(PlaidCredential);
    api.registerCredential(AbyssaleCredential);
    // NOTE: ElevenLabsCredential moved to the @gravity-platform/elevenlabs package.
  },
});

export default plugin;
