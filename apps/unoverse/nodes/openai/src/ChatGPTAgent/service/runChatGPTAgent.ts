import type { ChatGPTAgentConfig } from "../util/types";
import {
  discoverMCPTools,
  initializeOpenAIClient,
  buildInputItems,
  buildStreamParams,
  runConversationLoop,
  TextEmitter,
  ReasoningEmitter,
} from "../../shared/openaiStreamEngine";
import { generateThinkingLine, instantThinkingLine } from "../../shared/thinkingLine";

// Loop safety constants
const CONVERSATION_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes max for conversation

type CredentialContext = any;
type NodeExecutionContext = any;

type EmitFn = (output: any) => void;

export interface ChatGPTAgentOutput {
  __outputs: {
    chunk: string;
    text: string;
    thinking?: string;
    reasoning?: string; // Model reasoning/thinking (for analytics)
    responseId?: string; // OpenAI response ID for multi-turn (use with previous_response_id)
    focusInputRequired?: boolean; // True if agent needs user input (yields, waits for CONTINUE)
  };
}

export async function runChatGPTAgentCallback(
  config: ChatGPTAgentConfig,
  context: CredentialContext,
  logger: any,
  executionContext: NodeExecutionContext,
  emit: EmitFn,
  _previousResponseId?: string, // Deprecated - now handled by shared streaming service via Redis
): Promise<ChatGPTAgentOutput> {
  // Loop safety: track start time for timeout
  const agentStartTime = Date.now();

  // Get conversation state from Redis (for multi-turn with 30-min TTL)
  let previousResponseId: string | undefined;
  const redis = executionContext?.api?.getRedisClient?.();
  const pubCtx = executionContext?.publishingContext;
  const convKey =
    pubCtx?.conversationId && pubCtx?.userId && executionContext?.workflow?.id
      ? { workflowId: executionContext.workflow.id, conversationId: pubCtx.conversationId, userId: pubCtx.userId }
      : null;

  const redisKey = convKey ? `openai:conv:${convKey.workflowId}:${convKey.conversationId}:${convKey.userId}` : null;
  logger.info(`🔑 [Redis Conv] key=${redisKey}, hasRedis=${!!redis}`);

  // Check for reset trigger word (case-insensitive)
  const RESET_TRIGGERS = ["reset conversation", "reset_conversation"];
  const promptLower = (config.prompt || "").toLowerCase().trim();
  const shouldReset = RESET_TRIGGERS.some((trigger) => promptLower === trigger);

  // Debug: log prompt for reset check
  if (promptLower.includes("reset")) {
    logger.info(`🔍 [Reset Check] prompt="${promptLower.substring(0, 50)}", shouldReset=${shouldReset}`);
  }

  if (shouldReset && redis && redisKey) {
    try {
      await redis.del(redisKey);
      logger.info(`🔄 [Redis Conv] RESET - conversation cleared by user request`);
      // Return early with reset confirmation
      return {
        __outputs: {
          chunk: "Conversation reset. How can I help you?",
          text: "Conversation reset. How can I help you?",
          thinking: undefined,
          reasoning: undefined,
          responseId: undefined,
          focusInputRequired: undefined,
        },
      };
    } catch (e) {
      logger.warn(`❌ [Redis Conv] Reset failed: ${(e as Error).message}`);
    }
  }

  if (redis && redisKey) {
    try {
      const cached = await redis.get(redisKey);
      if (cached) {
        const convState = JSON.parse(cached);
        previousResponseId = convState.lastResponseId;
        logger.info(`📜 [Redis Conv] RESUMING from ${previousResponseId}`);
      } else {
        logger.info(`🆕 [Redis Conv] NEW conversation (no cache)`);
      }
    } catch (e) {
      logger.warn(`❌ [Redis Conv] Error: ${(e as Error).message}`);
    }
  } else {
    logger.warn(`⚠️ [Redis Conv] Missing redis=${!!redis} or key=${redisKey}`);
  }

  // Ambition controls how many tasks the agent can reason about and execute
  const ambitionSettings = {
    small: { maxIterations: 10 }, // Up to 5 tasks
    medium: { maxIterations: 15 }, // Up to 10 tasks
    large: { maxIterations: 20 }, // Up to 20 tasks
  };
  const { maxIterations } = ambitionSettings[config.ambition ?? "medium"];

  const openai = await initializeOpenAIClient(context, logger, executionContext?.api);

  // thinking = short customer-safe status line (separate output), written by
  // a nano model. Fired WITHOUT awaiting, and BEFORE the slow MCP discovery
  // below, so the line reaches the client ASAP while setup and the model run.
  // Each emit carries ONLY the current line (replace, not append).
  let lastThinking = "";
  let runSettled = false; // drop late nano lines once the run has returned
  const emitThinking = (line: string) => {
    if (!line || runSettled) return;
    lastThinking = line;
    emit({ __outputs: { thinking: line } });
  };
  const thinkingContext = {
    workflowId: executionContext?.workflow?.id,
    executionId: executionContext?.executionId,
    nodeId: executionContext?.nodeId,
    nodeType: "ChatGPTAgent",
    api: executionContext?.api,
  };
  const fireThinking = (event: Parameters<typeof generateThinkingLine>[0]) => {
    generateThinkingLine(event, openai, logger, thinkingContext).then(emitThinking);
  };

  // Instant local line first (0ms — guaranteed to beat the main model's first
  // token), then the nano-written contextual line replaces it when it arrives.
  emitThinking(instantThinkingLine());
  fireThinking({ kind: "turn_start", userMessage: config.prompt });

  // Get core MCPs (findIntent, discoverRelated, readSkill, readSkillFile)
  // Workflow MCPs are discovered at runtime via findIntent/discoverRelated
  const mcpConfig = await discoverMCPTools(executionContext, logger, undefined, executionContext?.api);

  // Append MCP instructions to system prompt (standard MCP spec pattern)
  let systemPrompt = config.systemPrompt || "";
  if (mcpConfig?.instructions) {
    systemPrompt = systemPrompt ? systemPrompt + "\n\n" + mcpConfig.instructions : mcpConfig.instructions;
  }

  const streamConfig = {
    model: config.model,
    maxTokens: config.maxTokens,
    systemPrompt,
    prompt: config.prompt,
    reasoningEffort: config.reasoningEffort,
    reasoningSummary: config.reasoningSummary,
    verbosity: config.verbosity,
    enablePreambles: config.enablePreambles,
    enableMarkdown: config.enableMarkdown,
    tools: mcpConfig?.tools,
  } as any;

  const inputItems = buildInputItems(streamConfig);
  const streamParams = buildStreamParams(streamConfig, inputItems, mcpConfig?.tools);

  // chunk = streaming text only
  const textEmitter = new TextEmitter(emit, logger);

  // reasoning = LLM reasoning (separate output)
  const reasoningEmitter = new ReasoningEmitter(emit, logger);

  // mcpResult = tool results (separate output) + a thinking line per tool call
  const emitMcpResult = (mcpResult: { name: string; arguments: any; result: any }) => {
    fireThinking({ kind: "tool_call", toolName: mcpResult.name, args: mcpResult.arguments });
    emit({ __outputs: { mcpResult } });
  };

  const result = await runConversationLoop({
    openai,
    streamParams,
    inputItems,
    mcpService: mcpConfig?.mcpService,
    textEmitter,
    reasoningEmitter,
    emit,
    emitMcpResult,
    logger,
    maxIterations,
    timeoutMs: CONVERSATION_TIMEOUT_MS,
    api: executionContext?.api,
    previousResponseId, // Pass previous response ID for multi-turn
    // Wired-in tools (getSchema set): SpatialSearch, memory, and connector MCPs
    // (Salesforce, etc.). A call to anything NOT in this set is a spatial-surfaced
    // workflow handoff that ends the turn. Connectors keep the conversation going.
    coreToolNames: (mcpConfig?.tools || []).map((t: any) => t.name).filter(Boolean),
    traceContext:
      executionContext?.executionId && executionContext?.nodeId
        ? { executionId: executionContext.executionId, parentNodeId: executionContext.nodeId }
        : undefined,
  });

  const finalText = result.fullText;
  const finalReasoning = result.reasoning || "";

  // Emit final chunk with complete text
  logger.info(`🏁 [Final] Text length: ${finalText.length}, ends with: "${finalText.slice(-50)}"`);
  textEmitter.emitFinal(finalText);

  // Focus Mode: Disabled by default - using ChatGPT's internal conversation memory
  // via previous_response_id for multi-turn persistence
  const focusInputRequired = false;

  // Get responseId for multi-turn persistence
  const responseId = result.responseId;

  // Save conversation state to Redis (30-min TTL)
  if (redis && redisKey && responseId) {
    try {
      await redis.setex(redisKey, 30 * 60, JSON.stringify({ lastResponseId: responseId }));
      logger.info(`💾 [Redis Conv] SAVED ${responseId} to ${redisKey}`);
    } catch (e) {
      logger.warn(`❌ [Redis Conv] Save failed: ${(e as Error).message}`);
    }
  }

  // Save token usage to database (pass full usage object for cached_tokens tracking)
  if (result.usage && result.usage.total_tokens > 0 && executionContext?.api?.saveTokenUsage) {
    try {
      await executionContext.api.saveTokenUsage({
        workflowId: executionContext.workflow?.id,
        executionId: executionContext.executionId,
        nodeId: executionContext.nodeId,
        nodeType: "ChatGPTAgent",
        model: config.model,
        usage: result.usage, // Pass entire usage object (includes cached_tokens, reasoning_tokens)
        timestamp: new Date(),
      });
      const cached = result.usage.input_tokens_details?.cached_tokens || 0;
      logger.info(`💾 [Token Usage] Saved: ${result.usage.total_tokens} tokens (${cached} cached)`);
    } catch (e) {
      logger.warn(`❌ [Token Usage] Save failed: ${(e as Error).message}`);
    }
  }

  runSettled = true;
  return {
    __outputs: {
      chunk: finalText,
      text: finalText,
      thinking: lastThinking || undefined,
      reasoning: finalReasoning || undefined,
      responseId: responseId || undefined,
      focusInputRequired: focusInputRequired || undefined,
    },
  };
}
