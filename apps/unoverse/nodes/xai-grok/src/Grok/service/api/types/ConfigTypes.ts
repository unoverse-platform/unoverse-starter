export interface XAIGrokVoiceConfig {
  systemPrompt?: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  initialRequest?: string;
  voice?: "eve" | "ara" | "rex" | "sal" | "leo";
  turnDetection?: "server_vad" | "manual";
  tools?: Array<{
    type: "function";
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
  mcpService?: Record<string, (input: any) => Promise<any>>;
  controlSignal?: "START_CALL" | "END_CALL";
  redisChannel?: string;
}
