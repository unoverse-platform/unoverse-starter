export interface OpenAIRealtimeConfig {
  systemPrompt?: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  initialRequest?: string;
  voice?: "alloy" | "ash" | "ballad" | "coral" | "echo" | "sage" | "shimmer" | "verse" | "marin" | "cedar";
  turnDetection?: "semantic_vad" | "server_vad" | "disabled";
  redisChannel?: string;
  maxResponseOutputTokens?: number;
  tools?: Array<{
    type: "function";
    name: string;
    description: string;
    parameters: any;
  }>;
  mcpService?: Record<string, (input: any) => Promise<any>>;
  controlSignal?: "START_CALL" | "END_CALL";
}

export interface StreamUsageStats {
  estimated: boolean;
  total_tokens: number;
  inputTokens: number;
  outputTokens: number;
  chunk_count: number;
  textOutput: string;
  transcription: string;
  assistantResponse: string;
}

export interface StreamingMetadata {
  workflowId?: string;
  executionId?: string;
  nodeId?: string;
  chatId?: string;
  conversationId?: string;
  userId?: string;
  providerId?: string;
}

export type AudioState =
  | "SPEECH_STARTED"
  | "SPEECH_STREAMING"
  | "SPEECH_ENDED"
  | "SESSION_READY"
  | "TOOL_USE"
  | "TOOL_USE_COMPLETED"
  | "USER_SPEECH_STARTED"
  | "USER_SPEECH_ENDED";
