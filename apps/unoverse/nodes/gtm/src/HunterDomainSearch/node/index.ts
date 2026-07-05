import { NodeInputType, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import { HunterDomainSearchExecutor } from "./executor";

export const NODE_TYPE = "HunterDomainSearch";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Hunter Domain Search",
    description:
      "Find every email address Hunter.io has for a domain or company, with role, seniority, department and confidence score",
    whenToUse:
      "Pick to list EVERY known email address at one domain/company — exhaustive email coverage of a single known domain. Use it when you have a domain and want all its addresses; finding one person's address, verifying deliverability, full profiles, or role-filtered people across companies are different jobs.",
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
        name: "emails",
        type: NodeInputType.ARRAY,
        description: "Array of found email addresses with owner name, position, seniority and confidence",
      },
      {
        name: "organization",
        type: NodeInputType.OBJECT,
        description: "Company metadata for the domain (name, industry, location, email pattern, socials)",
      },
      {
        name: "pattern",
        type: NodeInputType.STRING,
        description: "Detected email pattern for the domain (e.g. '{first}.{last}')",
      },
      {
        name: "totalResults",
        type: NodeInputType.NUMBER,
        description: "Total number of email addresses Hunter holds for this domain",
      },
      {
        name: "limit",
        type: NodeInputType.NUMBER,
        description: "Number of results requested per page",
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
        domain: {
          type: "string",
          title: "Domain",
          description: "Company domain to search (e.g. 'stripe.com'). Use this OR Company.",
          default: "",
          "ui:field": "template",
        },
        company: {
          type: "string",
          title: "Company",
          description: "Company name to search (e.g. 'Stripe'). Used when Domain is not provided.",
          default: "",
          "ui:field": "template",
        },
        type: {
          type: "string",
          title: "Email Type",
          description: "Filter to a kind of email address",
          default: "",
          enum: ["", "personal", "generic"],
          enumNames: ["Any", "Personal", "Generic"],
        },
        department: {
          type: "string",
          title: "Department",
          description:
            "Comma-separated departments (e.g. 'executive, it, sales, marketing, hr, finance, support')",
          default: "",
          "ui:field": "template",
        },
        seniority: {
          type: "string",
          title: "Seniority",
          description: "Comma-separated seniority levels (e.g. 'junior, senior, executive')",
          default: "",
          "ui:field": "template",
        },
        requiredField: {
          type: "string",
          title: "Required Field",
          description: "Only return emails that have this field populated",
          default: "",
          enum: ["", "full_name", "position", "phone_number"],
          enumNames: ["None", "Full name", "Position", "Phone number"],
        },
        limit: {
          type: "number",
          title: "Limit",
          description: "Number of emails to return (max 100)",
          default: 10,
          minimum: 1,
          maximum: 100,
        },
        offset: {
          type: "number",
          title: "Offset",
          description: "Number of emails to skip, for pagination",
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
        domain: "stripe.com",
        type: "generic",
        department: "executive, sales",
        seniority: "senior, executive",
        requiredField: "full_name",
        limit: 10,
        offset: 0,
      },
      inputs: { signal: { domain: "stripe.com" } },
    },
  };
}

const definition = createNodeDefinition();

export const HunterDomainSearchNode = {
  definition,
  executor: HunterDomainSearchExecutor,
};

export { createNodeDefinition };
