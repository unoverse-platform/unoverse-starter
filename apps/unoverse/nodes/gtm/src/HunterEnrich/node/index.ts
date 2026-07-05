import { NodeInputType, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import { HunterEnrichExecutor } from "./executor";

export const NODE_TYPE = "HunterEnrich";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Hunter Enrich",
    description:
      "Enrich a person and/or company from an email, a LinkedIn profile (handle or URL), or a domain — returns full profile, employment, location and social data",
    whenToUse:
      "Enrich a PERSON or COMPANY from an email, a LinkedIn profile (handle or URL), or a domain — returns the full profile: job, employment, location, socials, and company metrics. Use it for full enrichment; finding or verifying a single address, or listing a domain's emails, are different jobs.",
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
        name: "person",
        type: NodeInputType.OBJECT,
        description: "Enriched person profile (name, employment, location, socials), or null",
      },
      {
        name: "company",
        type: NodeInputType.OBJECT,
        description: "Enriched company profile (industry, metrics, location, socials), or null",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          title: "Enrichment Type",
          description: "What to enrich",
          default: "combined",
          enum: ["combined", "person", "company"],
          enumNames: ["Combined (person + company)", "Person only", "Company only"],
        },
        email: {
          type: "string",
          title: "Email",
          description: "Email address to enrich (required for Combined; for Person, use this OR LinkedIn)",
          default: "",
          "ui:field": "template",
          "ui:dependencies": { type: ["combined", "person"] },
        },
        linkedinHandle: {
          type: "string",
          title: "LinkedIn Handle or URL",
          description:
            "Person mode only: a handle ('satyanadella') or full URL. Takes precedence over Email. Lets you enrich straight from a LinkedIn profile.",
          default: "",
          "ui:field": "template",
          "ui:dependencies": { type: "person" },
        },
        domain: {
          type: "string",
          title: "Domain",
          description: "Company domain to enrich (required for Company)",
          default: "",
          "ui:field": "template",
          "ui:dependencies": { type: "company" },
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
        type: "combined",
        email: "patrick@stripe.com",
      },
      inputs: { signal: { email: "patrick@stripe.com" } },
    },
  };
}

const definition = createNodeDefinition();

export const HunterEnrichNode = {
  definition,
  executor: HunterEnrichExecutor,
};

export { createNodeDefinition };
