import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import { ApifyResultsExecutor } from "./executor";

export const NODE_TYPE = "ApifyResults";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType, NodeExecutionMode } = getPlatformDependencies();
  
  return {
    packageVersion: "1.1.1",
    type: NODE_TYPE,
    name: "Apify Results",
    description: "Fetch and iterate through results from an Apify run",
    whenToUse:
      "Pick to read and process scraped pages one item at a time from an Apify run. Always the downstream half of ApifyStarter — feed its runId; this is the only way to retrieve an Apify run's data. Iterates LoopStart-style: wire a signal back into the continue input to advance, checking hasMore.",
    category: "Web Scraping",
    color: "#00B4A6",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751511484/gravity/icons/apifyLogo.png",

    inputs: [
      {
        name: "signal",
        type: NodeInputType.STRING,
        description: "The Apify run ID to fetch results from",
      },
      {
        name: "continue",
        type: NodeInputType.OBJECT,
        description: "Signal to continue to next item",
      },
    ],

    outputs: [
      {
        name: "item",
        type: NodeInputType.OBJECT,
        description: "Current crawl result item",
      },
      {
        name: "index",
        type: NodeInputType.NUMBER,
        description: "Current item index (0-based)",
      },
      {
        name: "total",
        type: NodeInputType.NUMBER,
        description: "Total number of items",
      },
      {
        name: "hasMore",
        type: NodeInputType.BOOLEAN,
        description: "Whether there are more items to process",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        runId: {
          type: "string",
          title: "Run ID",
          description: "Apify run ID to fetch results from",
        },
      },
      required: ["runId"],
    },

    credentials: [
      {
        name: "apifyCredential",
        required: true,
      },
    ],

    capabilities: {
      isTrigger: false,
    },

    testData: {
      config: { runId: "abc123def456" },
      inputs: { signal: "abc123def456" },
    },
  };
}

const definition = createNodeDefinition();

export const ApifyResultsNode = {
  definition,
  executor: ApifyResultsExecutor,
};

export { createNodeDefinition };
