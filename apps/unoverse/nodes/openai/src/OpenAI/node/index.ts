/**
 * OpenAI Node Definition
 * Provides AI text generation capabilities using OpenAI's GPT models
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import OpenAIExecutor from "./executor";

// Export a function that creates the definition after platform deps are set
export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.1.5",
    type: "OpenAI",
    isService: false,
    name: "OpenAI",
    description: "Generate text using OpenAI's models",
    whenToUse:
      "Single prompt → single completion — the plain one-shot text generator: summarise, rewrite, classify, answer. No streaming, no tools, no schema enforcement; reach for a heavier node only when a step genuinely needs token streaming, iterative tool use, or strict JSON output.",
    category: "AI",
    color: "#2F6F66",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1749262616/gravity/icons/ChatGPT-Logo.svg.webp",

    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Data from previous nodes that can be referenced in templates",
      },
    ],

    outputs: [
      {
        name: "text",
        type: NodeInputType.STRING,
        description: "The generated text response from ChatGPT",
      },
      {
        name: "usage",
        type: NodeInputType.OBJECT,
        description: "Token burn",
        fields: [
          { name: "prompt_tokens", type: NodeInputType.NUMBER, description: "Tokens in the prompt" },
          { name: "completion_tokens", type: NodeInputType.NUMBER, description: "Tokens in the completion" },
          { name: "total_tokens", type: NodeInputType.NUMBER, description: "prompt + completion" },
        ],
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        model: {
          type: "string",
          title: "Model",
          description: "Select the OpenAI model to use",
          enum: ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo-preview", "gpt-4o"],
          enumNames: ["GPT-3.5 Turbo", "GPT-4", "GPT-4 Turbo", "GPT-4o"],
          default: "gpt-3.5-turbo",
        },
        temperature: {
          type: "number",
          title: "Temperature",
          description: "Controls randomness (0-2)",
          default: 0.7,
          minimum: 0,
          maximum: 2,
        },
        maxTokens: {
          type: "number",
          title: "Max Tokens",
          description: "Maximum number of tokens to generate",
          default: 256,
          minimum: 1,
          maximum: 4096,
        },
        systemPrompt: {
          type: "string",
          title: "System Prompt",
          description:
            "System message prompt. Supports template syntax like {{signal.<sourceNodeId>.<outputHandle>.<field>}} to reference input data.",
          default: "",
          "ui:field": "template",
        },
        prompt: {
          type: "string",
          title: "Prompt",
          description:
            "User message/prompt. Supports template syntax like {{signal.<sourceNodeId>.<outputHandle>.<field>}} to reference input data.",
          default: "",
          "ui:field": "template",
        },
        history: {
          type: "object",
          title: "History",
          description: "Message hostory [] for context",
          default: "",
          "ui:field": "template",
        },
      },
      required: ["model"],
    },

    // This is where we declare credential requirements
    credentials: [
      {
        name: "openAICredential",
        required: true,
        displayName: "OpenAI API",
        description: "OpenAI API credentials for authentication",
      },
    ],

    capabilities: {
      isTrigger: false,
    },

    // Sample config/inputs for the workbench "Load sample → Run" button. Template
    // fields (systemPrompt/prompt) are supplied already-resolved since the bench
    // has no upstream resolver.
    testData: {
      config: {
        model: "gpt-4o",
        temperature: 0.7,
        maxTokens: 256,
        systemPrompt: "You are a concise assistant.",
        prompt: "Write a one-sentence summary of what a workflow engine does.",
      },
      inputs: {
        signal: { question: "What does a workflow engine do?" },
      },
    },
  };
}

// Create and export the node
const definition = createNodeDefinition();

// Export as enhanced node
export const OpenAINode = {
  definition,
  executor: OpenAIExecutor,
};

// Export for node registry
export { definition };
