import { NodeInputType, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import { HunterDiscoverExecutor } from "./executor";

export const NODE_TYPE = "HunterDiscover";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Hunter Discover",
    description:
      "Find companies matching criteria — industry, technology, headcount, location, keywords or a natural-language query — for prospecting and lead-gen",
    whenToUse:
      "Pick to BUILD a target-company list from criteria (industry, tech stack, size, location) or a natural-language query — the starting point for GTM prospecting, with tech-stack/lookalike filters. Use it to discover unknown companies by criteria; if you already have a domain, you don't need a discovery step.",
    category: "Go To Market",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1781366295/gravity/icons/hunter.png",
    color: "#FF5500",

    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Data from previous nodes that can be referenced in templates",
      },
    ],

    outputs: [
      {
        name: "companies",
        type: NodeInputType.ARRAY,
        description: "Matched companies (domain, organization, email counts)",
      },
      {
        name: "totalResults",
        type: NodeInputType.NUMBER,
        description: "Number of companies returned",
      },
      {
        name: "limit",
        type: NodeInputType.NUMBER,
        description: "Results-per-page used",
      },
      {
        name: "offset",
        type: NodeInputType.NUMBER,
        description: "Result offset used for pagination",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          title: "Query",
          description:
            "Natural-language criteria, e.g. 'European companies specialising in software development'. If set, the structured filters below are ignored.",
          default: "",
          "ui:field": "template",
        },
        industry: {
          type: "string",
          title: "Industry",
          description: "Comma-separated industries (e.g. 'Technology, Financial Services')",
          default: "",
          "ui:field": "template",
        },
        country: {
          type: "string",
          title: "Country",
          description: "Comma-separated ISO country codes for HQ location (e.g. 'US, GB, DE')",
          default: "",
          "ui:field": "template",
        },
        headcount: {
          type: "string",
          title: "Headcount",
          description: "Comma-separated size buckets: 1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5001-10000, 10001+",
          default: "",
          "ui:field": "template",
        },
        technology: {
          type: "string",
          title: "Technology",
          description: "Comma-separated technologies the company uses (e.g. 'shopify, stripe') — Premium",
          default: "",
          "ui:field": "template",
        },
        keywords: {
          type: "string",
          title: "Keywords",
          description: "Comma-separated free-text keywords (e.g. 'cloud, security')",
          default: "",
          "ui:field": "template",
        },
        companyType: {
          type: "string",
          title: "Company Type",
          description:
            "Comma-separated types: privately held, public company, non profit, government agency, educational, partnership, self employed, sole proprietorship",
          default: "",
          "ui:field": "template",
        },
        similarTo: {
          type: "string",
          title: "Similar To",
          description: "A domain or company name to find lookalikes of (e.g. 'stripe.com') — Premium",
          default: "",
          "ui:field": "template",
        },
        limit: {
          type: "number",
          title: "Limit",
          description: "Companies to return (max 100)",
          default: 25,
          minimum: 1,
          maximum: 100,
        },
        offset: {
          type: "number",
          title: "Offset",
          description: "Number of companies to skip, for pagination",
          default: 0,
          minimum: 0,
        },
      },
      required: [],
    },

    credentials: [
      {
        name: "hunterCredential",
        required: true,
        displayName: "Hunter.io API",
        description: "Hunter.io API key for email discovery, verification and enrichment",
      },
    ],

    capabilities: {
      isTrigger: false,
    },

    testData: {
      config: {
        industry: "Technology, Financial Services",
        country: "US, GB",
        headcount: "51-200, 201-500",
        keywords: "payments, infrastructure",
        limit: 25,
        offset: 0,
      },
      inputs: { signal: { industry: "Financial Services", country: "US" } },
    },
  };
}

const definition = createNodeDefinition();

export const HunterDiscoverNode = {
  definition,
  executor: HunterDiscoverExecutor,
};

export { createNodeDefinition };
