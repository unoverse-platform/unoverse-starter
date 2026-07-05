import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import { HyperbrowserExtractExecutor } from "./executor";
import { FETCH_SESSION_CONFIG_PROPERTIES } from "../../shared/hyperbrowser";

export const NODE_TYPE = "HyperbrowserExtract";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.1.0",
    type: NODE_TYPE,
    name: "Hyperbrowser Extract",
    description: "Extract structured JSON from one or more URLs using a prompt and/or schema",
    whenToUse:
      "Pick when you need TYPED FIELDS (an object/array matching a schema) pulled from pages by an LLM. Provide a schema and/or prompt. It returns structured typed data — not raw page markdown, and not a multi-page crawl.",
    category: "Web Scraping",
    color: "#FF6B6B",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751883548/gravity/icons/HyperBrowser.svg",

    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "URL or array of URLs to extract from",
      },
    ],

    outputs: [
      { name: "data", type: NodeInputType.OBJECT, description: "Extracted structured data" },
      { name: "metadata", type: NodeInputType.OBJECT, description: "Extraction metadata (urls, timestamp)" },
    ],

    configSchema: {
      type: "object",
      properties: {
        urls: {
          type: "object",
          title: "URLs",
          description: "URL or array of URLs to extract from. Use `return signal.<id>.<handle>.<field>`",
          "ui:field": "template",
        },
        prompt: {
          type: "string",
          title: "Extraction Prompt",
          description: "Natural-language description of what to extract",
          "ui:field": "template",
        },
        schema: {
          type: "object",
          title: "JSON Schema",
          description: "Optional JSON schema describing the shape to extract. Use `return { ... }`",
          "ui:field": "template",
        },
        ...FETCH_SESSION_CONFIG_PROPERTIES,
      },
      required: ["urls"],
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
      config: {
        urls: ["https://example.com"],
        prompt: "Extract the page title and a one-sentence summary of the content",
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
          },
        },
        useStealth: true,
      },
      inputs: { signal: "https://example.com" },
    },
  };
}

const definition = createNodeDefinition();

export const HyperbrowserExtractNode = {
  definition,
  executor: HyperbrowserExtractExecutor,
};

export { createNodeDefinition };
