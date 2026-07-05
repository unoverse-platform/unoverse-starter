import { NodeInputType, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import { HunterEmailVerifierExecutor } from "./executor";

export const NODE_TYPE = "HunterEmailVerifier";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Hunter Email Verifier",
    description:
      "Verify whether an email address is deliverable, returning status, deliverability result, score and SMTP/MX checks",
    whenToUse:
      "Pick to CHECK that a single email address is real and deliverable before sending. Use it to verify an address you already have; discovering an unknown address is a separate, upstream step.",
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
        description: "The email address that was verified",
      },
      {
        name: "status",
        type: NodeInputType.STRING,
        description: "Verification status: valid, invalid, accept_all, webmail, disposable or unknown",
      },
      {
        name: "result",
        type: NodeInputType.STRING,
        description: "Deliverability result: deliverable, undeliverable or risky",
      },
      {
        name: "score",
        type: NodeInputType.NUMBER,
        description: "Confidence score 0-100 for the verification",
      },
      {
        name: "accept_all",
        type: NodeInputType.BOOLEAN,
        description: "True if the domain accepts all addresses (catch-all), making verification less certain",
      },
      {
        name: "disposable",
        type: NodeInputType.BOOLEAN,
        description: "True if the address belongs to a disposable email provider",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          title: "Email",
          description: "The email address to verify (e.g. 'patrick@stripe.com')",
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
        email: "patrick@stripe.com",
      },
      inputs: { signal: { email: "patrick@stripe.com" } },
    },
  };
}

const definition = createNodeDefinition();

export const HunterEmailVerifierNode = {
  definition,
  executor: HunterEmailVerifierExecutor,
};

export { createNodeDefinition };
