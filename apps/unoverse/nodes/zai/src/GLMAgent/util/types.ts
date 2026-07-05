/** A single chat-completions message in the running conversation. */
export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  // assistant turns that called tools
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  // tool result turns
  tool_call_id?: string;
}

export interface GLMAgentConfig {
  model: string;
  agentName?: string;
  systemPrompt?: string;
  prompt: string;
  maxTurns?: number;
  // GLM-5.2 reasoning_effort (https://docs.z.ai/guides/llm/glm-5.2). Only the three behaviourally
  // distinct values are exposed (default "high"). "none" disables thinking. GLM collapses the rest
  // (xhigh→max, low/medium→high, minimal→off); "minimal" kept here only so older configs still type.
  reasoningEffort?: "high" | "max" | "none" | "minimal";
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  enablePreambles?: boolean;
  enableMarkdown?: boolean;
  // Memory toggles — read platform-side (memoryFlagsForNode) to inject the matching tools
  // onto this agent's MCP schema. User memory = memory/queryMemory; agent (goal-scoped)
  // memory = getGoalContext/writeNote/updateGoalState/searchHistory/archiveGoal.
  enableUserMemory?: boolean;
  enableAgentMemory?: boolean;
}

export interface GLMAgentState {
  chunk: string;
  text: string;
  reasoning?: string;
  hasStartedStreaming?: boolean;
  // In-process fallback conversation history (used when no Redis conversation key exists).
  history?: ChatMessage[];
  continueCount?: number;
  firstExecuteTime?: number;
}

export interface GLMAgentOutput {
  __outputs: {
    chunk: string;
    text: string;
    progress?: string;
    reasoning?: string;
    mcpResult?: any;
    // Conversation history after this turn — kept in executor state as a no-Redis fallback.
    history?: ChatMessage[];
    focusInputRequired?: boolean;
    // Set when the run ended WITHOUT a clean final answer (e.g. turn-limit hit).
    incomplete?: boolean;
    stopReason?: string;
  };
}
