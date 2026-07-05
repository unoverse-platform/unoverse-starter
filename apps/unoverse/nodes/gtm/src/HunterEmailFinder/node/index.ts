import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import { HunterEmailFinderExecutor } from "./executor";

export const NODE_TYPE = "HunterEmailFinder";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Hunter Email Finder",
    description:
      "Find the most likely email address for a specific person from their name + company domain, OR from a LinkedIn profile (handle or URL), with a confidence score",
    whenToUse:
      "Pick when you have a person's LinkedIn profile (handle or URL) or name + company/domain and need ONLY their work email + confidence score — works directly from a LinkedIn URL. Use it to find one specific person's address; listing all addresses at a domain, verifying deliverability, or a full profile are different jobs.",
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
        name: "email",
        type: NodeInputType.STRING,
        description: "The most likely email address for the person (empty if none found)",
      },
      {
        name: "score",
        type: NodeInputType.NUMBER,
        description: "Confidence score 0-100 for the returned email",
      },
      {
        name: "position",
        type: NodeInputType.STRING,
        description: "Job position of the person, when known",
      },
      {
        name: "linkedin_url",
        type: NodeInputType.STRING,
        description: "LinkedIn profile URL, when known",
      },
      {
        name: "verification_status",
        type: NodeInputType.STRING,
        description: "Hunter's verification status for the email, when available",
      },
      {
        name: "sources_count",
        type: NodeInputType.NUMBER,
        description: "Number of public sources backing the email",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        linkedinHandle: {
          type: "string",
          title: "LinkedIn Handle or URL",
          description:
            "LinkedIn profile — a handle ('satyanadella') or full URL ('https://linkedin.com/in/satyanadella'). Alone this identifies the person; no domain/name needed.",
          default: "",
          "ui:field": "template",
        },
        domain: {
          type: "string",
          title: "Domain",
          description: "Company domain (e.g. 'stripe.com'). Use this OR Company.",
          default: "",
          "ui:field": "template",
        },
        company: {
          type: "string",
          title: "Company",
          description: "Company name (e.g. 'Stripe'). Used when Domain is not provided.",
          default: "",
          "ui:field": "template",
        },
        firstName: {
          type: "string",
          title: "First Name",
          description: "Person's first name (used with Last Name)",
          default: "",
          "ui:field": "template",
        },
        lastName: {
          type: "string",
          title: "Last Name",
          description: "Person's last name (used with First Name)",
          default: "",
          "ui:field": "template",
        },
        fullName: {
          type: "string",
          title: "Full Name",
          description: "Person's full name. Overrides First/Last Name when provided.",
          default: "",
          "ui:field": "template",
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
        firstName: "Jane",
        lastName: "Doe",
        fullName: "Jane Doe",
      },
      inputs: { signal: { domain: "stripe.com", firstName: "Jane", lastName: "Doe" } },
    },
  };
}

const definition = createNodeDefinition();

export const HunterEmailFinderNode = {
  definition,
  executor: HunterEmailFinderExecutor,
};

export { createNodeDefinition };
