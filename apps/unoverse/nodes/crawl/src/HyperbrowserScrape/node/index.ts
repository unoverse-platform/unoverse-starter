import { getPlatformDependencies, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import { HyperbrowserScrapeExecutor } from "./executor";
import { FETCH_SESSION_CONFIG_PROPERTIES } from "../../shared/hyperbrowser";

export const NODE_TYPE = "HyperbrowserScrape";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.1.0",
    type: NODE_TYPE,
    name: "Hyperbrowser Scrape",
    description: "Scrape a single URL to markdown, HTML and links with a stealth headless browser",
    whenToUse:
      "Pick to grab the content of ONE known URL as markdown/links. It scrapes a single known page; following links across a site, schema-typed extraction, or finding URLs by query are different jobs.",
    category: "Web Scraping",
    color: "#FF6B6B",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751883548/gravity/icons/HyperBrowser.svg",

    inputs: [
      {
        name: "signal",
        type: NodeInputType.STRING,
        description: "URL to scrape",
      },
    ],

    outputs: [
      { name: "markdown", type: NodeInputType.STRING, description: "Page content as markdown" },
      { name: "html", type: NodeInputType.STRING, description: "Page content as HTML" },
      { name: "links", type: NodeInputType.ARRAY, description: "Links found on the page" },
      { name: "metadata", type: NodeInputType.OBJECT, description: "Page metadata (title, description, etc.)" },
    ],

    configSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          title: "URL",
          description: "The URL to scrape",
          default: "",
          "ui:field": "template",
        },
        onlyMainContent: {
          type: "boolean",
          title: "Main Content Only",
          description: "Strip navigation, footers and boilerplate, keeping the article body",
          default: true,
          "ui:widget": "toggle",
        },
        waitFor: {
          type: "number",
          title: "Wait For (ms)",
          description: "Extra time to wait after load for JS-rendered content",
          minimum: 0,
          maximum: 30000,
        },
        ...FETCH_SESSION_CONFIG_PROPERTIES,
      },
      required: ["url"],
    },

    credentials: [
      {
        name: "hyperbrowserCredential",
        required: true,
        displayName: "Hyperbrowser API",
        description: "Hyperbrowser API credentials",
      },
    ],

    capabilities: {
      isTrigger: false,
      // Idempotent read — scraping the same URL yields the same page. Safe to
      // memoize: the engine reuses a prior output when config+scope fingerprint
      // matches, instead of re-scraping. See EXECUTION_EFFICIENCY.md §3.2.
      cacheable: true,
    },

    testData: {
      config: { url: "https://example.com", onlyMainContent: true, useStealth: true },
      inputs: { signal: "https://example.com" },
    },
  };
}

const definition = createNodeDefinition();

export const HyperbrowserScrapeNode = {
  definition,
  executor: HyperbrowserScrapeExecutor,
};

export { createNodeDefinition };
