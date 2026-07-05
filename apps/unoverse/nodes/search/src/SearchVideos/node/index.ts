import { type EnhancedNodeDefinition, NodeInputType } from "@gravity-platform/plugin-base";
import SearchVideosExecutor from "./executor";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: "SearchVideos",
    isService: false,
    name: "Search Videos",
    description: "Search YouTube videos by keyword via SearchAPI.io (youtube)",
    whenToUse:
      "Pick to find YOUTUBE VIDEOS for a keyword — title, channel, views, length and thumbnail per result. Use it when you specifically want video content; it returns videos, not arbitrary web pages, dated articles, or places.",
    category: "Search",
    color: "#FF0000",
    logoUrl: "https://cdn-icons-png.flaticon.com/512/1384/1384060.png",

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
        name: "videoResults",
        type: NodeInputType.ARRAY,
        description: "Array of YouTube video results (title, url, channel, views, length, thumbnail)",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          title: "Search Query",
          description: "Keywords to search YouTube for",
          default: "",
          "ui:field": "template",
        },
        numResults: {
          type: "number",
          title: "Number of Results",
          description: "Number of video results to return",
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
          description: "Interface language code (e.g., 'en', 'ar')",
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
        description: "SearchAPI.io credentials for YouTube search",
      },
    ],

    capabilities: {
      isTrigger: false,
      cacheable: true,
    },

    testData: {
      config: {
        query: "how to make espresso at home",
        numResults: 20,
        country: "us",
        language: "en",
      },
      inputs: { query: "how to make espresso at home" },
    },
  };
}

export const SearchVideosNode = {
  get definition() {
    return createNodeDefinition();
  },
  executor: SearchVideosExecutor,
};
