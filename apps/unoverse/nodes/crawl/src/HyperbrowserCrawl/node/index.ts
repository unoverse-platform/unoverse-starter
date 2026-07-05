import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import { HyperbrowserCrawlExecutor } from "./executor";
import { SESSION_CONFIG_PROPERTIES } from "../../shared/hyperbrowser";

export const NODE_TYPE = "HyperbrowserCrawl";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Hyperbrowser Crawl",
    description: "Crawl a site from a seed URL across many pages, returning per-page markdown and links",
    whenToUse:
      "Pick to FOLLOW LINKS from a seed URL across many pages of one site (set maxPages). It crawls multiple linked pages of a site — not a single page, not typed-schema extraction, and not a bulk offloaded actor run.",
    category: "Web Scraping",
    color: "#FF6B6B",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751883548/gravity/icons/HyperBrowser.svg",

    inputs: [
      {
        name: "signal",
        type: NodeInputType.STRING,
        description: "Seed URL to start crawling from",
      },
    ],

    outputs: [
      { name: "pages", type: NodeInputType.ARRAY, description: "Crawled pages with markdown, links and metadata" },
      { name: "links", type: NodeInputType.ARRAY, description: "All links found across crawled pages" },
      { name: "metadata", type: NodeInputType.OBJECT, description: "Crawl statistics (seed url, total pages)" },
    ],

    configSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          title: "Seed URL",
          description: "The URL to start crawling from",
          default: "",
          "ui:field": "template",
        },
        maxPages: {
          type: "number",
          title: "Max Pages",
          description: "Maximum number of pages to crawl",
          default: 10,
          minimum: 1,
          maximum: 500,
        },
        onlyMainContent: {
          type: "boolean",
          title: "Main Content Only",
          description: "Strip navigation, footers and boilerplate from each page",
          default: true,
          "ui:widget": "toggle",
        },
        includePatterns: {
          type: "string",
          title: "Include Patterns",
          description: "Comma-separated URL glob patterns to include (e.g. /blog/*, /docs/*)",
          placeholder: "/blog/*, /docs/*",
        },
        excludePatterns: {
          type: "string",
          title: "Exclude Patterns",
          description: "Comma-separated URL glob patterns to skip (e.g. /login*, *.pdf)",
          placeholder: "/login*, *.pdf",
        },
        ...SESSION_CONFIG_PROPERTIES,
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
    },

    testData: {
      config: { url: "https://example.com", maxPages: 5, onlyMainContent: true, useStealth: true },
      inputs: { signal: "https://example.com" },
    },
  };
}

const definition = createNodeDefinition();

export const HyperbrowserCrawlNode = {
  definition,
  executor: HyperbrowserCrawlExecutor,
};

export { createNodeDefinition };
