import { NodeInputType, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import { ApolloCompanyEnrichExecutor } from "./executor";

export const NODE_TYPE = "ApolloCompanyEnrich";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Apollo Company Enrich",
    description: "Enrich a company profile from Apollo.io using its domain",
    whenToUse:
      "Pick when you ALREADY HAVE a company domain and need its full Apollo profile (industry, revenue, headcount, funding) — firmographics and funding data. Use it to enrich a known company domain; discovering companies, or enriching people, are different jobs.",
    category: "Go To Market",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1775374180/gravity/icons/apollo.jpg",
    color: "#F5D800",

    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Data from previous nodes that can be referenced in templates",
      },
    ],

    outputs: [
      {
        name: "company",
        type: NodeInputType.OBJECT,
        description: "Enriched company profile from Apollo.io including industry, revenue, employee count, funding and contact details",
      },
      {
        name: "found",
        type: NodeInputType.BOOLEAN,
        description: "Whether a matching company was found in Apollo",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          title: "Company Domain",
          description: "Domain of the company to enrich (e.g. 'google.com')",
          default: "",
          "ui:field": "template",
        },
      },
      required: ["domain"],
    },

    credentials: [
      {
        name: "apolloCredential",
        required: true,
        displayName: "Apollo.io API",
        description: "Apollo.io master API key for enrichment",
      },
    ],

    capabilities: {
      isTrigger: false,
    },

    testData: {
      config: {
        domain: "stripe.com",
      },
      inputs: { signal: { domain: "stripe.com" } },
    },
  };
}

const definition = createNodeDefinition();

export const ApolloCompanyEnrichNode = {
  definition,
  executor: ApolloCompanyEnrichExecutor,
};

export { createNodeDefinition };
