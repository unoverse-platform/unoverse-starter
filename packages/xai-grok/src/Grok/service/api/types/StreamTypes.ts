export interface StreamingMetadata {
  chatId?: string;
  conversationId?: string;
  userId?: string;
  workflowId?: string;
  executionId?: string;
  providerId?: string;
  nodeId?: string;
}

export interface StreamUsageStats {
  estimated: boolean;
  total_tokens: number;
  inputTokens: number;
  outputTokens: number;
  chunk_count: number;
  textOutput: string;
  audioOutput?: string;
  transcription: string;
  assistantResponse: string;
}

export type AudioState =
  | "SPEECH_STARTED"
  | "SPEECH_STREAMING"
  | "SPEECH_ENDED"
  | "SESSION_READY"
  | "TOOL_USE"
  | "TOOL_USE_COMPLETED";
