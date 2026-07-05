export interface OpenAIAgentConfig {
  model: string;
  agentName?: string;
  systemPrompt?: string;
  prompt: string;
  maxTurns?: number;
  reasoningEffort?: "none" | "low" | "medium" | "high" | "xhigh";
  reasoningSummary?: "auto" | "concise" | "detailed" | "none";
  verbosity?: "low" | "medium" | "high";
  enablePreambles?: boolean;
  enableMarkdown?: boolean;
}

export interface OpenAIAgentState {
  chunk: string;
  text: string;
  reasoning?: string;
  hasStartedStreaming?: boolean;
  responseId?: string;
  continueCount?: number;
  firstExecuteTime?: number;
}

export interface OpenAIAgentOutput {
  __outputs: {
    chunk: string;
    text: string;
    thinking?: string;
    reasoning?: string;
    responseId?: string;
    mcpResult?: any;
    focusInputRequired?: boolean;
    // Set when the run ended WITHOUT a clean final answer (e.g. turn-limit hit).
    // A machine-readable stop signal so a controller can branch on outcome rather
    // than assuming success. text still carries the best partial output.
    incomplete?: boolean;
    stopReason?: string;
  };
}
