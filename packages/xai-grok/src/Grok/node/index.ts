import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import GrokVoiceExecutor from "./executor";

export function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType, AI_RESULT_CHANNEL, SYSTEM_CHANNEL } = getPlatformDependencies();

  return {
    packageVersion: "1.0.0",
    type: "XAIGrokVoice",
    isService: false,
    name: "xAI Grok Voice",
    description: "Generate AI-powered voice using xAI Grok Voice Agent",
    category: "AI",
    color: "#000000",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/xai.png",
    inputs: [
      {
        name: "input",
        type: NodeInputType.ANY,
        description: "Input data",
      },
    ],
    outputs: [
      {
        name: "text",
        type: NodeInputType.OBJECT,
        description: "Conversation object with query (user transcription) and response (assistant text)",
      },
      {
        name: "conversation",
        type: NodeInputType.OBJECT,
        description: "Combined conversation object with user and assistant messages",
      },
      {
        name: "mcpResult",
        type: NodeInputType.OBJECT,
        description: "MCP tool results",
      },
    ],
    configSchema: {
      type: "object",
      properties: {
        systemPrompt: {
          type: "string",
          title: "System Prompt",
          description: "System instructions for Grok. Supports template syntax like {{input.fieldName}}.",
          default: "",
          "ui:field": "template",
        },
        conversationHistory: {
          type: "object",
          title: "Conversation History",
          description: "JSON array of conversation history",
          "ui:field": "template",
        },
        initialRequest: {
          type: "string",
          title: "Initial Request",
          description: "Text sent as user message at call start — Grok responds immediately",
          default: "",
          "ui:field": "template",
        },
        voice: {
          type: "string",
          title: "Voice",
          description: "Select the voice for speech generation",
          enum: ["eve", "ara", "rex", "sal", "leo"],
          enumNames: ["Eve", "Ara", "Rex", "Sal", "Leo"],
          default: "eve",
        },
        turnDetection: {
          type: "string",
          title: "Turn Detection",
          description: "How Grok detects end of user speech",
          enum: ["server_vad", "manual"],
          enumNames: ["Server VAD (automatic)", "Manual"],
          default: "server_vad",
        },
        redisChannel: {
          type: "string",
          title: "Redis Channel",
          description: "Redis channel to publish audio chunks to",
          enum: [AI_RESULT_CHANNEL, SYSTEM_CHANNEL],
          enumNames: ["AI Results", "System Messages"],
          default: AI_RESULT_CHANNEL,
        },
      },
      required: ["voice", "redisChannel"],
      "ui:order": [
        "systemPrompt",
        "conversationHistory",
        "initialRequest",
        "voice",
        "turnDetection",
        "redisChannel",
      ],
    },
    capabilities: { isTrigger: false },
    serviceConnectors: [
      {
        name: "mcpService",
        description: "MCP service connector — automatic schema discovery",
        serviceType: "mcp",
        isService: false,
      },
    ],
    credentials: [
      {
        name: "xaiCredential",
        required: true,
        displayName: "xAI Credentials",
        description: "xAI API key for Grok Voice Agent",
      },
    ],
  };
}

export const GrokVoiceNode = {
  get definition() {
    return createNodeDefinition();
  },
  executor: GrokVoiceExecutor,
};
