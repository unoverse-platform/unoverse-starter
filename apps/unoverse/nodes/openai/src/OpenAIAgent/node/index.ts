import { type EnhancedNodeDefinition, NodeInputType } from "@unoverse-platform/plugin-base";
import OpenAIAgentExecutor from "./executor";

const definition: EnhancedNodeDefinition = {
  type: "OpenAIAgent",
  isService: false,
  name: "OpenAI Agent",
  description: "Multi-turn agent powered by OpenAI Agents SDK with MCP tool calling and streaming",
  whenToUse:
    "Run an autonomous GPT-5 agent that iteratively reasons, calls tools, and streams its answer across many plan-act-observe turns — for genuinely long-running, multi-step work that a single pass can't finish. Built on a real agent loop, so it's the heavier, wrong choice for one-shot completions; consumes tools from MCP provider nodes attached via service edges.",
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
      name: "thinking",
      type: NodeInputType.STRING,
      description: "Short customer-safe thinking status lines (emitted in real-time)",
    },
    {
      name: "chunk",
      type: NodeInputType.STRING,
      description: "Streaming LLM text response (emitted in real-time)",
    },
    {
      name: "reasoning",
      type: NodeInputType.STRING,
      description: "LLM reasoning/thinking (separate output)",
    },
    {
      name: "mcpResult",
      type: NodeInputType.OBJECT,
      description: "MCP tool results",
    },
    {
      name: "text",
      type: NodeInputType.STRING,
      description: "Final synthesized response",
    },
  ],

  configSchema: {
    type: "object",
    properties: {
      model: {
        type: "string",
        title: "Model",
        description: "Select the OpenAI model",
        enum: ["gpt-5.5", "gpt-5.4-mini", "gpt-5.2", "gpt-5.2-pro"],
        enumNames: [
          "GPT-5.5 (Latest)",
          "GPT-5.4 Mini (Fast)",
          "GPT-5.2",
          "GPT-5.2 Pro (Deep reasoning)",
        ],
        default: "gpt-5.5",
      },
      agentName: {
        type: "string",
        title: "Agent Name",
        description: "Name for this agent (appears in traces)",
        default: "GravityAgent",
      },
      maxTurns: {
        type: "number",
        title: "Max Turns",
        description: "Maximum agent loop iterations (tool calls + responses)",
        default: 15,
        minimum: 1,
        maximum: 50,
      },
      reasoningEffort: {
        type: "string",
        title: "Reasoning Effort",
        description:
          "Reasoning depth. medium is the recommended baseline; high/xhigh for complex agentic builds; none only for latency-critical turns with no tool chaining.",
        enum: ["none", "low", "medium", "high", "xhigh"],
        enumNames: ["None (fastest)", "Low", "Medium (recommended)", "High", "XHigh (hardest tasks)"],
        default: "medium",
      },
      reasoningSummary: {
        type: "string",
        title: "Reasoning Summary",
        description: "Stream the model's reasoning summary to the reasoning output ('none' disables)",
        enum: ["auto", "concise", "detailed", "none"],
        default: "auto",
      },
      verbosity: {
        type: "string",
        title: "Verbosity",
        description: "Final answer length, independent of reasoning depth",
        enum: ["low", "medium", "high"],
        enumNames: ["Low (concise)", "Medium", "High (detailed)"],
        default: "medium",
      },
      enablePreambles: {
        type: "boolean",
        title: "Enable Preambles",
        description: "Let the model explain why before calling tools",
        default: true,
      },
      enableMarkdown: {
        type: "boolean",
        title: "Enable Markdown Formatting",
        description:
          "Instruct the model to format output as Markdown (headings, lists, tables, code). On by default because the output usually feeds a display node that renders Markdown — AIResponse, MarkdownRenderer, or a report template — where plain text renders tables and structure as flat text. Turn off for raw/plain-text outputs. GPT-5 does not use Markdown unless instructed.",
        default: true,
      },
      enableUserMemory: {
        type: "boolean",
        title: "User Memory",
        description:
          "Give THIS agent recall of facts about the user (memory/queryMemory). Per-agent; default off.",
        default: false,
      },
      enableAgentMemory: {
        type: "boolean",
        title: "Agent Memory",
        description:
          "Give THIS agent goal-scoped working memory (getGoalContext/writeNote/updateGoalState/searchHistory/archiveGoal). Per-agent: leave off for stateless workers; turn on for long-running goal-pursuing agents.",
        default: false,
      },
      systemPrompt: {
        type: "string",
        title: "Instructions",
        description: "Agent instructions (system prompt). Supports template syntax like {{signal.<sourceNodeId>.<outputHandle>.<field>}}",
        default: "",
        "ui:field": "template",
        "ui:ai": {
          editable: true,
        },
      },
      prompt: {
        type: "string",
        title: "Input",
        description: "User input message. Supports template syntax like {{signal.<sourceNodeId>.<outputHandle>.<field>}}",
        default: "",
        "ui:field": "template",
        "ui:ai": {
          editable: true,
        },
      },
    },
    required: ["model", "prompt"],
    "ui:order": [
      "model",
      "agentName",
      "maxTurns",
      "reasoningEffort",
      "reasoningSummary",
      "verbosity",
      "enablePreambles",
      "enableMarkdown",
      "enableUserMemory",
      "enableAgentMemory",
      "systemPrompt",
      "prompt",
    ],
  },

  credentials: [
    {
      name: "openAICredential",
      required: true,
      displayName: "OpenAI API",
      description: "OpenAI API credentials for authentication",
    },
  ],

  serviceConnectors: [
    {
      name: "mcpService",
      description: "MCP service connector - automatic schema discovery",
      serviceType: "mcp",
      isService: false,
    },
  ],

  // Sample config/inputs for the workbench "Load sample → Run" button. Template
  // fields (systemPrompt/prompt) are supplied already-resolved since the bench
  // has no upstream resolver.
  testData: {
    config: {
      model: "gpt-5.5",
      agentName: "GravityAgent",
      maxTurns: 15,
      reasoningEffort: "medium",
      reasoningSummary: "auto",
      verbosity: "medium",
      enablePreambles: true,
      enableMarkdown: true,
      systemPrompt:
        "You are an autonomous research agent. Use any available tools to gather information before answering.",
      prompt: "Find the current status of the auth-gate project and summarize the next steps.",
    },
    inputs: {
      signal: {
        goal: "auth-gate status",
        context: "Working on the feat/auth-gate branch.",
      },
    },
  },
};

export const OpenAIAgentNode = {
  definition,
  executor: OpenAIAgentExecutor,
};

export { definition };
