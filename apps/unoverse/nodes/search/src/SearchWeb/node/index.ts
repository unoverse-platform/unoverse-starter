import { type EnhancedNodeDefinition, NodeInputType } from "@gravity-platform/plugin-base";
import SearchWebExecutor from "./executor";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: "SearchWeb",
    isService: false,
    name: "Search Web",
    description: "Search the web using SearchAPI.io (Google) for web results and images",
    whenToUse:
      "Pick to find WEB PAGES and images for a keyword query — titles, URLs and snippets from across the open web (Google). Use it for general open-web results — any relevant page; it returns web pages, not specifically dated news, videos, places, or social posts.",
    category: "Search",
    color: "#4285F4",
    logoUrl: "https://cdn-icons-png.flaticon.com/512/3128/3128287.png",

    inputs: [
      {
        name: "query",
        type: NodeInputType.STRING,
        description: "Search query",
        required: false,
      },
    ],

    outputs: [
      {
        name: "webResults",
        type: NodeInputType.ARRAY,
        description: "Array of web search results",
      },
      {
        name: "imageResults",
        type: NodeInputType.ARRAY,
        description: "Array of image search results",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          title: "Search Query",
          description: "Query to search for",
          default: "",
          "ui:field": "template",
        },
        numResults: {
          type: "number",
          title: "Number of Results",
          description: "Number of web results to return",
          default: 20,
          minimum: 1,
          maximum: 100,
        },
        numImages: {
          type: "number",
          title: "Number of Images",
          description: "Number of image results to return",
          default: 10,
          minimum: 0,
          maximum: 50,
          "ui:dependencies": {
            searchImages: true,
          },
        },
        searchImages: {
          type: "boolean",
          title: "Search Images",
          description: "Whether to search for images",
          default: true,
          "ui:widget": "toggle",
        },
        safeSearch: {
          type: "string",
          title: "Safe Search",
          description: "Safe search filter level",
          // SearchAPI's google `safe` param only accepts "active" or "off".
          // "moderate" was previously offered here and caused HTTP 400 on every search.
          enum: ["active", "off"],
          enumNames: ["Active", "Off"],
          default: "active",
        },
        country: {
          type: "string",
          title: "Country",
          description: "Country code for localized results (e.g., 'us', 'uk', 'ae')",
          default: "us",
        },
        language: {
          type: "string",
          title: "Language",
          description: "Language code for results (e.g., 'en', 'ar')",
          default: "en",
        },
      },
      required: ["query"],
    },

    credentials: [
      {
        name: "searchapiCredential",
        required: true,
        displayName: "SearchAPI",
        description: "SearchAPI.io credentials for web search",
      },
    ],

    capabilities: {
      isTrigger: false,
      // Idempotent read — same query yields the same results. Safe to memoize:
      // the engine reuses a prior output when config+scope fingerprint matches,
      // instead of re-running the search. See EXECUTION_EFFICIENCY.md §3.2.
      cacheable: true,
    },

    testData: {
      config: {
        query: "AI regulation",
        numResults: 20,
        numImages: 10,
        searchImages: true,
        safeSearch: "active",
        country: "us",
        language: "en",
      },
      inputs: { query: "AI regulation" },
    },
  };
}

export const SearchWebNode = {
  get definition() {
    return createNodeDefinition();
  },
  executor: SearchWebExecutor,
};
