import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import RealtimeVoiceExecutor from "./executor";

export function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType, AI_RESULT_CHANNEL, SYSTEM_CHANNEL } = getPlatformDependencies();

  return {
    packageVersion: "1.0.0",
    type: "OpenAIRealtimeVoice",
    isService: false,
    name: "OpenAI Realtime Voice",
    description: "Real-time voice conversation with gpt-realtime-2 via WebSocket",
    whenToUse:
      "Live WebSocket voice conversation with OpenAI gpt-realtime; audio chunks publish to a Redis channel and it can call MCP tools via service edges. Alternatives: XAIGrokVoice (xAI) or AWSNovaSpeech (AWS). For plain text-to-speech use ElevenLabs.",
    category: "Voice",
    color: "#10A37F",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1749262616/gravity/icons/ChatGPT-Logo.svg.webp",
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
      {
        name: "progress",
        type: NodeInputType.STRING,
        description: "Real-time progress log of tool calls and conversation turns",
      },
    ],
    configSchema: {
      type: "object",
      properties: {
        systemPrompt: {
          type: "string",
          title: "System Prompt",
          description: "System instructions for the model. Supports template syntax like {{signal.<sourceNodeId>.<outputHandle>.<field>}}.",
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
          type: "object",
          title: "Initial Request",
          description: "Text sent as user message at call start — the model responds immediately",
          "ui:field": "template",
        },
        voice: {
          type: "string",
          title: "Voice",
          description: "Select the voice for speech generation",
          enum: ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse", "marin", "cedar"],
          enumNames: ["Alloy", "Ash", "Ballad", "Coral", "Echo", "Sage", "Shimmer", "Verse", "Marin", "Cedar"],
          default: "alloy",
        },
        turnDetection: {
          type: "string",
          title: "Turn Detection",
          description: "How the model detects end of user speech",
          enum: ["semantic_vad", "server_vad", "disabled"],
          enumNames: ["Semantic VAD (recommended)", "Server VAD (threshold-based)", "Disabled"],
          default: "semantic_vad",
        },
        maxResponseOutputTokens: {
          type: "number",
          title: "Max Response Tokens",
          description: "Maximum tokens in assistant response (inf for unlimited)",
          default: 4096,
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
        "maxResponseOutputTokens",
        "redisChannel",
      ],
    },
    capabilities: { isTrigger: false },
    testData: {
      config: {
        systemPrompt: "You are a helpful real-time voice assistant. Listen to the user, respond conversationally, and keep answers concise and natural to speak aloud.",
        initialRequest: { text: "Hello, can you help me plan a weekend trip to Lisbon?" },
        voice: "alloy",
        turnDetection: "semantic_vad",
        maxResponseOutputTokens: 4096,
        redisChannel: AI_RESULT_CHANNEL,
      },
      inputs: { input: {} },
    },
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
        name: "openaiCredential",
        required: true,
        displayName: "OpenAI Credentials",
        description: "OpenAI API key for Realtime API",
      },
    ],
  };
}

export const RealtimeVoiceNode = {
  get definition() {
    return createNodeDefinition();
  },
  executor: RealtimeVoiceExecutor,
};
