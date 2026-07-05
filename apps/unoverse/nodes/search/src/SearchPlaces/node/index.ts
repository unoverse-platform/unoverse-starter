import { type EnhancedNodeDefinition, NodeInputType } from "@gravity-platform/plugin-base";
import SearchPlacesExecutor from "./executor";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: "SearchPlaces",
    isService: false,
    name: "Search Places",
    description: "Find local businesses and places with ratings via SearchAPI.io (Google Maps)",
    whenToUse:
      "Pick to find local BUSINESSES or PLACES — each result carries address, rating, review count, phone, website and GPS coordinates (Google Maps). Use it when you need structured place/location data; it returns places, not arbitrary web pages, dated articles, or videos.",
    category: "Search",
    color: "#34A853",
    logoUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",

    inputs: [
      {
        name: "query",
        type: NodeInputType.STRING,
        description: "Search query (e.g. 'coffee shops')",
        required: false,
      },
    ],

    outputs: [
      {
        name: "placeResults",
        type: NodeInputType.ARRAY,
        description: "Array of place results (title, address, rating, reviews, type, phone, website, coordinates)",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          title: "Search Query",
          description: "What to search for on Maps (e.g. 'coffee shops', 'dentist')",
          default: "",
          "ui:field": "template",
        },
        location: {
          type: "string",
          title: "Location",
          description:
            "Optional coordinate filter, SearchAPI 'll' format e.g. '@40.7009973,-73.994778,12z'. Leave blank to infer from the query.",
          default: "",
        },
        numResults: {
          type: "number",
          title: "Number of Results",
          description: "Number of place results to return",
          default: 20,
          minimum: 1,
          maximum: 100,
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
        description: "SearchAPI.io credentials for Maps search",
      },
    ],

    capabilities: {
      isTrigger: false,
      cacheable: true,
    },

    testData: {
      config: {
        query: "best coffee shops in Berlin",
        location: "",
        numResults: 20,
        language: "en",
      },
      inputs: { query: "best coffee shops in Berlin" },
    },
  };
}

export const SearchPlacesNode = {
  get definition() {
    return createNodeDefinition();
  },
  executor: SearchPlacesExecutor,
};
