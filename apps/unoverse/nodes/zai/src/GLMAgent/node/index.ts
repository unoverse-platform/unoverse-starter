import { type EnhancedNodeDefinition, NodeInputType } from "@unoverse-platform/plugin-base";
import GLMAgentExecutor from "./executor";

const definition: EnhancedNodeDefinition = {
  type: "GLMAgent",
  isService: false,
  name: "GLM Agent",
  description: "Multi-turn GLM-5.2 (Z.AI) agent with MCP tool calling, reasoning, and streaming",
  whenToUse:
    "Run a multi-turn agent on Z.AI's GLM-5.2 that calls tools, reasons, and streams its answer — pick specifically when you want the GLM model family (large context, strong coding/agentic reasoning). Consumes tools from MCP provider nodes attached via service edges.",
  category: "AI",
  color: "#014f56",
  logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1782027963/gravity/icons/z.svg",

  inputs: [
    {
      name: "signal",
      type: NodeInputType.OBJECT,
      description: "Data from previous nodes that can be referenced in templates",
    },
  ],

  outputs: [
    {
      name: "progress",
      type: NodeInputType.STRING,
      description: "Tool call log (emitted in real-time)",
    },
    {
      name: "chunk",
      type: NodeInputType.STRING,
      description: "Streaming LLM text response (emitted in real-time)",
    },
    {
      name: "reasoning",
      type: NodeInputType.STRING,
      description: "GLM reasoning/thinking stream (separate output)",
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
        description:
          "Z.AI GLM model. GLM-5.2: deepest agentic reasoning, supports all three Reasoning Effort settings. GLM-5-Turbo: faster/cheaper, 200K context — supports thinking on/off but ignores the High vs Max distinction (reasoning_effort is GLM-5.2+ only), so 'High' and 'Max' behave the same on Turbo.",
        enum: ["glm-5.2", "glm-5-turbo"],
        enumNames: ["GLM-5.2 (deepest reasoning)", "GLM-5-Turbo (faster/cheaper)"],
        default: "glm-5.2",
      },
      agentName: {
        type: "string",
        title: "Agent Name",
        description: "Name for this agent (for logs/traces)",
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
          "Depth of GLM-5.2's chain-of-thought. These are the only three settings that change behaviour: 'High' is enhanced reasoning (default — strong agentic tool-calling at far fewer reasoning tokens); 'Max' is GLM's deepest reasoning (most tokens); 'Off' disables thinking entirely (fastest/cheapest, ~zero reasoning tokens). GLM internally collapses the other documented values (xhigh→max, low/medium→high, minimal→off), so they are deliberately not exposed — picking 'Low' would still run full High reasoning.",
        enum: ["high", "max", "none"],
        enumNames: [
          "High (enhanced reasoning, default)",
          "Max (deepest reasoning, most tokens)",
          "Off (no thinking, fastest/cheapest)",
        ],
        default: "high",
      },
      maxTokens: {
        type: "number",
        title: "Max Output Tokens",
        description:
          "Maximum output tokens (GLM-5.2 supports up to 128K). CRITICAL with thinking enabled: reasoning_content (<think>…</think>) counts against this budget, and the model only emits a tool call AFTER thinking closes. Set too low and a long reasoning pass is truncated (finish_reason=length) before any tool call — so the agent silently never calls a tool. The GLM-5 model card recommends 65536 for agentic/tool use; default set accordingly.",
        default: 65536,
        minimum: 1,
        maximum: 131072,
      },
      temperature: {
        type: "number",
        title: "Temperature",
        description: "Sampling temperature (GLM-5.2 default 1.0)",
        default: 1.0,
        minimum: 0,
        maximum: 1,
        step: 0.1,
      },
      topP: {
        type: "number",
        title: "Top P",
        description: "Nucleus sampling (GLM-5.2 default 0.95)",
        default: 0.95,
        minimum: 0.01,
        maximum: 1,
        step: 0.01,
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
          "Instruct the model to format output as Markdown (headings, lists, tables, code). On by default because the output usually feeds a display node that renders Markdown. Turn off for raw/plain-text outputs.",
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
        description:
          "Agent instructions (system prompt). Supports template syntax like {{signal.<sourceNodeId>.<outputHandle>.<field>}}",
        default: "",
        "ui:field": "template",
        "ui:ai": {
          editable: true,
        },
      },
      prompt: {
        type: "string",
        title: "Input",
        description:
          "User input message. Supports template syntax like {{signal.<sourceNodeId>.<outputHandle>.<field>}}",
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
      "maxTokens",
      "temperature",
      "topP",
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
      name: "zaiApiKey",
      required: true,
      displayName: "Z.AI API",
      description: "Z.AI API key for authentication",
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

  testData: {
    config: {
      model: "glm-5.2",
      agentName: "ResearchAssistant",
      maxTurns: 15,
      reasoningEffort: "high",
      maxTokens: 65536,
      temperature: 1.0,
      topP: 0.95,
      enablePreambles: true,
      enableMarkdown: true,
      enableUserMemory: false,
      enableAgentMemory: false,
      systemPrompt: "You are a concise research assistant. Answer the user's question accurately and format the response in Markdown.",
      prompt: "Summarize the key trade-offs between server-side and client-side rendering for web apps.",
    },
    inputs: {
      signal: {
        topic: "rendering strategies",
        notes: "User is building a content-heavy marketing site and cares about SEO and load time.",
      },
    },
  },
};

export const GLMAgentNode = {
  definition,
  executor: GLMAgentExecutor,
};

export { definition };
