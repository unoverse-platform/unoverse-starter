import { createPlugin } from "@unoverse-platform/plugin-base";

// Crawl package: Hyperbrowser scrape/crawl/extract + Apify actor runs.
const plugin = createPlugin({
  name: "@unoverse-platform/crawl",
  version: "1.0.0",
  description: "Web crawling nodes — Hyperbrowser scrape/crawl/extract and Apify actor runs",

  async setup(api) {
    const { initializePlatformFromAPI } = await import("@unoverse-platform/plugin-base");
    initializePlatformFromAPI(api);

    // Hyperbrowser nodes
    const { HyperbrowserScrapeNode } = await import("./HyperbrowserScrape/node");
    api.registerNode(HyperbrowserScrapeNode);
    const { HyperbrowserCrawlNode } = await import("./HyperbrowserCrawl/node");
    api.registerNode(HyperbrowserCrawlNode);
    const { HyperbrowserExtractNode } = await import("./HyperbrowserExtract/node");
    api.registerNode(HyperbrowserExtractNode);

    // Apify nodes
    const { ApifyStarterNode } = await import("./ApifyStarter/node");
    api.registerNode(ApifyStarterNode);
    const { ApifyResultsNode } = await import("./ApifyResults/node");
    api.registerNode(ApifyResultsNode);

    // Credentials
    const { HyperbrowserCredential, ApifyCredential } = await import("./credentials");
    api.registerCredential(HyperbrowserCredential);
    api.registerCredential(ApifyCredential);
  },
});

export default plugin;
