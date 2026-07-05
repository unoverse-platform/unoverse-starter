import { Agent, run, tool, setDefaultOpenAIClient } from "@openai/agents";
import type { OpenAIAgentConfig, OpenAIAgentOutput } from "../util/types";
import { discoverMCPTools } from "../../shared/openaiStream/mcp/toolDiscovery";
import { initializeOpenAIClient } from "../../shared/openaiStream/client/openaiClient";
import { TextEmitter } from "../../shared/openaiStream/streaming/textEmitter";
import { ReasoningEmitter } from "../../shared/openaiStream/streaming/reasoningEmitter";
import { generateThinkingLine, instantThinkingLine } from "../../shared/thinkingLine";

type CredentialContext = any;
type NodeExecutionContext = any;
type EmitFn = (output: any) => void;

export async function runOpenAIAgent(
  config: OpenAIAgentConfig,
  context: CredentialContext,
  logger: any,
  executionContext: NodeExecutionContext,
  emit: EmitFn,
  _previousResponseId?: string,
): Promise<OpenAIAgentOutput> {
  // Get conversation state from Redis (multi-turn with 30-min TTL)
  let previousResponseId: string | undefined;
  const redis = executionContext?.api?.getRedisClient?.();
  const pubCtx = executionContext?.publishingContext;
  const convKey =
    pubCtx?.conversationId && pubCtx?.userId && executionContext?.workflow?.id
      ? { workflowId: executionContext.workflow.id, conversationId: pubCtx.conversationId, userId: pubCtx.userId }
      : null;

  const redisKey = convKey ? `openai:conv:${convKey.workflowId}:${convKey.conversationId}:${convKey.userId}` : null;
  logger.info(`[OpenAIAgent] Redis key=${redisKey}, hasRedis=${!!redis}`);

  // Check for reset trigger
  const promptLower = (config.prompt || "").toLowerCase().trim();
  if (promptLower === "reset conversation" || promptLower === "reset_conversation") {
    if (redis && redisKey) {
      try {
        await redis.del(redisKey);
        logger.info(`[OpenAIAgent] Conversation reset by user`);
      } catch (e) {
        logger.warn(`[OpenAIAgent] Reset failed: ${(e as Error).message}`);
      }
    }
    return {
      __outputs: {
        chunk: "Conversation reset. How can I help you?",
        text: "Conversation reset. How can I help you?",
      },
    };
  }

  // Load previous response ID from Redis
  if (redis && redisKey) {
    try {
      const cached = await redis.get(redisKey);
      if (cached) {
        const convState = JSON.parse(cached);
        previousResponseId = convState.lastResponseId;
        logger.info(`[OpenAIAgent] Resuming from ${previousResponseId}`);
      } else {
        logger.info(`[OpenAIAgent] New conversation`);
      }
    } catch (e) {
      logger.warn(`[OpenAIAgent] Redis error: ${(e as Error).message}`);
    }
  }

  // Initialize OpenAI client with platform credentials and set as SDK default
  const openai = await initializeOpenAIClient(context, logger, executionContext?.api);
  setDefaultOpenAIClient(openai);

  // thinking = short customer-safe status line (separate output), written by a
  // nano model. Fired WITHOUT awaiting, and BEFORE the slow MCP discovery below,
  // so the line reaches the client ASAP while setup and the main model run.
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
    nodeType: "OpenAIAgent",
    api: executionContext?.api,
  };
  const fireThinking = (event: Parameters<typeof generateThinkingLine>[0]) => {
    generateThinkingLine(event, openai, logger, thinkingContext).then(emitThinking);
  };

  // Instant local line first (0ms — guaranteed to beat the main model's first
  // token), then the nano-written contextual line replaces it when it arrives.
  emitThinking(instantThinkingLine());
  fireThinking({ kind: "turn_start", userMessage: config.prompt });

  // Discover MCP tools from connected nodes
  const mcpConfig = await discoverMCPTools(executionContext, logger, undefined, executionContext?.api);

  // Bridge MCP tools to SDK tool() format
  const sdkTools = mcpConfig ? bridgeMCPToSDKTools(mcpConfig.tools, mcpConfig.mcpService, logger) : [];

  // Build instructions
  let instructions = config.systemPrompt || "";
  if (mcpConfig?.instructions) {
    instructions += "\n\n" + mcpConfig.instructions;
  }
  if (sdkTools.length > 0 && config.enablePreambles !== false) {
    instructions += "\n\nBefore you call a tool, explain why you are calling it.";
  }
  if (!sdkTools.length) {
    instructions +=
      "\n\nTools are unavailable in this environment. Do not call tools. Provide the best possible direct answer to the user.";
  }
  if (config.enableMarkdown) {
    instructions +=
      "\n\nUse Markdown formatting where semantically correct (e.g., `inline code`, ```code fences```, lists, tables).";
  }

  // Create SDK Agent
  const agent = new Agent({
    name: config.agentName || "GravityAgent",
    model: config.model,
    instructions: instructions || undefined,
    tools: sdkTools,
    modelSettings: {
      reasoning: {
        effort: config.reasoningEffort || "medium",
        // Summaries must be REQUESTED or the API emits no reasoning events at all
        ...(config.reasoningSummary !== "none" ? { summary: config.reasoningSummary || "auto" } : {}),
      },
      text: { verbosity: config.verbosity || "medium" },
    },
  });

  // Run with streaming
  const textEmitter = new TextEmitter(emit, logger);
  const reasoningEmitter = new ReasoningEmitter(emit, logger);
  let finalText = "";
  let accumulatedText = "";
  let accumulatedReasoning = "";

  // ── Memory-first context — EVERY run (HARNESS.md §10 / the continuity contract) ──
  // The harness builder's source of truth is the GOAL BOARD, never its own chat thread. The
  // thread (previousResponseId) is still replayed for build continuity, but its last line is
  // often "I'm done" — so on a repair turn the agent idles ("ready for the next request")
  // unless memory LEADS. Therefore, on EVERY run, code (never the LLM's discretion — it skips
  // the getGoalContext call) reads the goal board and leads the prompt with the master context:
  // the goal, the locked bar, plan/progress, what's already been tried, and — if the judge
  // rejected the last build — the exact blockers to fix. Deterministic and unskippable. The
  // thread remains available as background detail; memory is what the agent starts each turn on.
  //
  // GATED to harness builders (toolset includes saveWorkflow): a plain chat agent with memory
  // on must NOT get this goal/rebuild framing. Mirrors PlatformMemoryTools.isHarnessBuilder.
  // Led as a fresh USER turn (never the system prompt) so prompt caching + the previousResponseId
  // resume survive (cache discipline).
  let runPrompt = config.prompt;
  const isHarnessBuilder = !!mcpConfig?.mcpService?.saveWorkflow;
  if (isHarnessBuilder && mcpConfig?.mcpService?.getGoalContext) {
    try {
      const goalCtx = await mcpConfig.mcpService.getGoalContext({});
      const master = buildMasterContext(goalCtx);
      if (master) {
        runPrompt = master + "\n\n---\n\n" + config.prompt;
        const blockerCount = Array.isArray(goalCtx?.state?.blockers) ? goalCtx.state.blockers.length : 0;
        logger.info(`[OpenAIAgent] Led prompt with goal-board master context (${blockerCount} open blocker(s))`);
      }
    } catch (e) {
      logger.warn(`[OpenAIAgent] Goal-context read failed (continuing): ${(e as Error).message}`);
    }
  }

  try {
    const stream = await run(agent, runPrompt, {
      stream: true,
      maxTurns: config.maxTurns || 15,
      previousResponseId,
    });

    for await (const event of stream) {
      if (event.type === "raw_model_stream_event") {
        const data = event.data as any;

        // The SDK NORMALIZES text deltas to 'output_text_delta' (the raw
        // 'response.output_text.delta' shape never reaches us on this SDK —
        // raw Responses events arrive wrapped as {type:'model', event}).
        if (data.type === "output_text_delta" && typeof data.delta === "string") {
          accumulatedText += data.delta;
          textEmitter.emitIfNeeded(accumulatedText, data.delta.length);
        }

        // Reasoning summaries have no normalized event — read the raw pass-through
        const raw = data.type === "model" ? (data.event as any) : null;
        if (raw?.type === "response.reasoning_summary_text.delta" && typeof raw.delta === "string") {
          accumulatedReasoning += raw.delta;
          reasoningEmitter.emitIfNeeded(accumulatedReasoning, raw.delta.length);
        }
        if (raw?.type === "response.reasoning_summary_part.done") {
          accumulatedReasoning += "\n\n";
        }
      }

      if (event.type === "run_item_stream_event") {
        if (event.name === "tool_called") {
          const item = event.item as any;
          let toolArgs: any;
          try {
            toolArgs = item.rawItem?.arguments ? JSON.parse(item.rawItem.arguments) : undefined;
          } catch {
            toolArgs = item.rawItem?.arguments;
          }
          fireThinking({ kind: "tool_call", toolName: item.rawItem?.name || "tool", args: toolArgs });
        }
        if (event.name === "tool_output") {
          const item = event.item as any;
          const toolName = item.rawItem?.call_id || "tool";
          emit({ __outputs: { mcpResult: { name: toolName, result: item.output } } });
        }
      }
    }

    await stream.completed;
    finalText = typeof stream.finalOutput === "string" ? stream.finalOutput : "";
    const responseId = stream.lastResponseId;

    // Emit final text + reasoning
    if (finalText) {
      textEmitter.emitFinal(finalText);
    }
    if (accumulatedReasoning) {
      reasoningEmitter.emitFinal(accumulatedReasoning.trim());
    }

    // Save conversation state to Redis
    if (redis && redisKey && responseId) {
      try {
        await redis.setex(redisKey, 30 * 60, JSON.stringify({ lastResponseId: responseId }));
        logger.info(`[OpenAIAgent] Saved responseId ${responseId}`);
      } catch (e) {
        logger.warn(`[OpenAIAgent] Redis save failed: ${(e as Error).message}`);
      }
    }

    // Save token usage if available
    const usage = (stream as any).usage;
    if (usage && usage.total_tokens > 0 && executionContext?.api?.saveTokenUsage) {
      try {
        await executionContext.api.saveTokenUsage({
          workflowId: executionContext.workflow?.id,
          executionId: executionContext.executionId,
          nodeId: executionContext.nodeId,
          nodeType: "OpenAIAgent",
          model: config.model,
          usage,
          timestamp: new Date(),
        });
      } catch (e) {
        logger.warn(`[OpenAIAgent] Token usage save failed: ${(e as Error).message}`);
      }
    }

    runSettled = true;
    return {
      __outputs: {
        chunk: finalText,
        text: finalText,
        thinking: lastThinking || undefined,
        reasoning: accumulatedReasoning.trim() || undefined,
        responseId: responseId || undefined,
        focusInputRequired: undefined,
      },
    };
  } catch (error: any) {
    const errName = error?.name || "";
    const errMsg = error?.message || "Agent execution failed";

    // Max turns is a PAUSE, not a failure: the agent ran out of turns
    // mid-task. Persist the response chain so "continue" resumes it, and
    // return a friendly handoff instead of an error.
    if (errName === "MaxTurnsExceededError") {
      const respId =
        error?.state?.lastResponseId ||
        error?.state?._lastResponseId ||
        error?.state?.lastProcessedResponse?.providerData?.id;
      if (redis && redisKey && respId) {
        try {
          await redis.setex(redisKey, 30 * 60, JSON.stringify({ lastResponseId: respId }));
        } catch {
          /* best effort */
        }
      }
      // Never log the error object — the SDK embeds the ENTIRE run transcript
      // in error.state and serializing it floods the log.
      const limit = config.maxTurns || 15;
      logger.warn(
        `[OpenAIAgent] Max turns (${limit}) reached — incomplete, progress ${respId ? "saved" : "NOT saved (no responseId)"}`
      );
      // Hitting the turn limit is an INCOMPLETE result, not a clean pause. Surface
      // the partial work (don't discard it) plus a machine-readable stop signal so
      // an autonomous caller — e.g. a goal controller — can report the best result
      // so far and branch on outcome, while an interactive user still sees the
      // partial answer and can resume. (Previously this returned only a
      // "say continue" message, which dropped the partial output AND required a
      // human to proceed — breaking unattended/long-running use.)
      const partial = accumulatedText.trim();
      const notice = `[Incomplete: reached the ${limit}-turn limit before finishing.${
        respId ? ' Reply "continue" to resume.' : ""
      }]`;
      const text = partial ? `${partial}\n\n${notice}` : notice;
      runSettled = true;
      return {
        __outputs: {
          chunk: text,
          text,
          thinking: lastThinking || undefined,
          responseId: respId || undefined,
          incomplete: true,
          stopReason: "max_turns",
        },
      };
    }

    // Generic failure: log name+message only, never the raw error object
    logger.error(`[OpenAIAgent] Error: ${errMsg}`, { name: errName });

    runSettled = true;
    return {
      __outputs: {
        chunk: `Error: ${errMsg}`,
        text: `Error: ${errMsg}`,
      },
    };
  }
}

/**
 * Compose the harness builder's master context from the goal board — read at the START of
 * EVERY run so memory, not the replayed chat thread, is the source of truth for "where am I."
 * Composition, not dump (AGENT_MEMORY §B): goal + locked bar + plan/progress + open blockers
 * + what's already been tried, kept compact. Returns "" when there is no active goal.
 */
function buildMasterContext(goalCtx: any): string {
  if (!goalCtx || (!goalCtx.goal && !goalCtx.state)) return "";
  const lines: string[] = [];
  const goal = goalCtx.goal || {};
  const state = goalCtx.state || {};

  lines.push("━━ CURRENT GOAL (read FIRST — the goal board is your source of truth, not your prior chat) ━━");
  if (goal.description) lines.push(`Goal: ${goal.description}`);

  const criteria = parseCriteriaList(goal.acceptanceCriteria);
  if (criteria.length) {
    lines.push("Acceptance bar (an independent judge scores against EXACTLY these):");
    for (const c of criteria) lines.push(`  • ${c}`);
  }

  const prog = goalCtx.progress;
  if (prog && typeof prog.total === "number" && prog.total > 0) {
    lines.push(`Progress: ${prog.done}/${prog.total} steps done`);
  }
  const plan = Array.isArray(state.plan) ? state.plan : [];
  if (plan.length) {
    lines.push("Plan:");
    for (const s of plan) lines.push(`  - ${typeof s === "string" ? s : JSON.stringify(s)}`);
  }
  if (state.currentStep) lines.push(`Current step: ${state.currentStep}`);

  const blockers = Array.isArray(state.blockers) ? state.blockers : [];
  if (blockers.length) {
    lines.push("");
    lines.push(
      "⚠️ Your last build was REJECTED by the independent judge — it is NOT done. Fix these EXACT gaps, then rebuild and re-run; do NOT re-submit the same build:",
    );
    for (const b of blockers) lines.push(`  • ${b}`);
  }

  // What's already been tried (recent journal) — so it doesn't repeat a dead end.
  const notes = Array.isArray(goalCtx.recentNotes) ? goalCtx.recentNotes.slice(-5) : [];
  const tried = notes
    .filter((n: any) => n && (n.category === "error" || n.category === "decision" || n.category === "result"))
    .map((n: any) => `  • [${n.category}] ${typeof n.content === "string" ? n.content : JSON.stringify(n.content)}`);
  if (tried.length) {
    lines.push("");
    lines.push("Already tried (do not repeat what failed):");
    lines.push(...tried);
  }

  lines.push("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  return lines.join("\n");
}

/** acceptanceCriteria may arrive as string[] or a JSON-encoded string[] (storage serializes it). */
function parseCriteriaList(v: any): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
  if (typeof v === "string" && v.trim()) {
    const t = v.trim();
    if (t.startsWith("[")) {
      try {
        const arr = JSON.parse(t);
        return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [t];
      } catch {
        return [t];
      }
    }
    return [t];
  }
  return [];
}

function bridgeMCPToSDKTools(mcpTools: any[], mcpService: Record<string, (input: any) => Promise<any>>, logger: any) {
  return mcpTools.map((mcpTool: any) =>
    tool({
      name: mcpTool.name,
      description: mcpTool.description || `Execute ${mcpTool.name}`,
      parameters: mcpTool.parameters || { type: "object", properties: {} },
      execute: async (args: any) => {
        logger.info(`[OpenAIAgent] Tool call: ${mcpTool.name}`, { args });
        const result = await mcpService[mcpTool.name](args);
        return typeof result === "string" ? result : JSON.stringify(result);
      },
    }),
  );
}
