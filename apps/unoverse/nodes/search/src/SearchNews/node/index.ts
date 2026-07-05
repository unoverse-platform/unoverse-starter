import { type EnhancedNodeDefinition, NodeInputType } from "@gravity-platform/plugin-base";
import SearchNewsExecutor from "./executor";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: "SearchNews",
    isService: false,
    name: "Search News",
    description: "Find recent news articles on a topic via SearchAPI.io (Google News)",
    whenToUse:
      "Pick to find recent, DATED news articles on a topic — each result carries a publication date and source (Google News). Use it specifically when recency and an article's date matter; it returns dated news, not arbitrary web pages, videos, places, or social posts.",
    category: "Search",
    color: "#DB4437",
    logoUrl: "https://cdn-icons-png.flaticon.com/512/2965/2965879.png",

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
        name: "newsResults",
        type: NodeInputType.ARRAY,
        description: "Array of news article results (title, url, source, date, snippet, thumbnail)",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          title: "Search Query",
          description: "Topic or keywords to search news for",
          default: "",
          "ui:field": "template",
        },
        numResults: {
          type: "number",
          title: "Number of Results",
          description: "Number of news results to return",
          default: 20,
          minimum: 1,
          maximum: 100,
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
        description: "SearchAPI.io credentials for news search",
      },
    ],

    capabilities: {
      isTrigger: false,
      cacheable: true,
    },

    testData: {
      config: {
        query: "AI regulation",
        numResults: 20,
        country: "us",
        language: "en",
      },
      inputs: { query: "AI regulation" },
    },
  };
}

export const SearchNewsNode = {
  get definition() {
    return createNodeDefinition();
  },
  executor: SearchNewsExecutor,
};
