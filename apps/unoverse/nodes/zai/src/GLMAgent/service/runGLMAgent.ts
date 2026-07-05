import OpenAI from "openai";
import type { ChatMessage, GLMAgentConfig, GLMAgentOutput } from "../util/types";
import { discoverMCPTools } from "./mcpDiscovery";

type CredentialContext = any;
type NodeExecutionContext = any;
type EmitFn = (output: any) => void;

const DEFAULT_BASE_URL = "https://api.z.ai/api/paas/v4";

// Emit streamed text at most this often (chars) to avoid flooding the bus.
const EMIT_THRESHOLD_CHARS = 24;
// Reasoning is far denser than the answer (esp. at reasoning_effort "max"), so it's throttled
// much harder than text — each emit re-renders the connected display node. Mirrors OpenAIAgent's
// ReasoningEmitter (150-char interval); the previous 24-char threshold flooded downstream
// re-executions and could stall completion.
const REASONING_EMIT_THRESHOLD_CHARS = 150;

// Multi-turn history is NOT persisted to Redis for now — disabled deliberately. When false, GLM
// neither reads nor writes the zai:conv:* key and relies solely on the in-process executor-state
// fallback (priorHistory) for continuity within a live session. Flip to true to restore Redis.
const REDIS_HISTORY_ENABLED = false;

/**
 * Run a multi-turn GLM (Z.AI) agent over the chat-completions API.
 *
 * Mirrors OpenAIAgent's contract (same outputs, MCP tool bridging, streaming via emit,
 * multi-turn) but speaks chat-completions instead of the OpenAI Responses API — GLM has
 * no `previous_response_id`, so conversation state is the full `messages[]` array persisted
 * to Redis (falling back to executor state when no conversation key exists).
 */
export async function runGLMAgent(
  config: GLMAgentConfig,
  context: CredentialContext,
  logger: any,
  executionContext: NodeExecutionContext,
  emit: EmitFn,
  priorHistory?: ChatMessage[],
): Promise<GLMAgentOutput> {
  // ── Conversation state (multi-turn) ──────────────────────────────────────
  const redis = executionContext?.api?.getRedisClient?.();
  const pubCtx = executionContext?.publishingContext;
  const redisKey =
    REDIS_HISTORY_ENABLED && pubCtx?.conversationId && pubCtx?.userId && executionContext?.workflow?.id
      ? `zai:conv:${executionContext.workflow.id}:${pubCtx.conversationId}:${pubCtx.userId}`
      : null;
  logger.info(`[GLMAgent] Redis key=${redisKey}, hasRedis=${!!redis}`);

  // Reset trigger — same UX as the OpenAI agents.
  const promptLower = (config.prompt || "").toLowerCase().trim();
  if (promptLower === "reset conversation" || promptLower === "reset_conversation") {
    if (redis && redisKey) {
      try {
        await redis.del(redisKey);
        logger.info("[GLMAgent] Conversation reset by user");
      } catch (e) {
        logger.warn(`[GLMAgent] Reset failed: ${(e as Error).message}`);
      }
    }
    const msg = "Conversation reset. How can I help you?";
    return { __outputs: { chunk: msg, text: msg, history: [] } };
  }

  // Load prior turns: Redis first, then executor-state fallback.
  let history: ChatMessage[] = [];
  if (redis && redisKey) {
    try {
      const cached = await redis.get(redisKey);
      if (cached) {
        history = JSON.parse(cached);
        logger.info(`[GLMAgent] Resuming conversation (${history.length} prior messages)`);
      }
    } catch (e) {
      logger.warn(`[GLMAgent] Redis read error: ${(e as Error).message}`);
    }
  }
  if (history.length === 0 && Array.isArray(priorHistory) && priorHistory.length > 0) {
    history = priorHistory;
    logger.info(`[GLMAgent] Resuming from state history (${history.length} messages)`);
  }

  // ── Credentials → client ─────────────────────────────────────────────────
  const available = context?.credentials || {};
  const creds: any = available.zaiApiKey ?? Object.values(available).find((c: any) => c?.apiKey);
  if (!creds?.apiKey) {
    throw new Error("Z.AI API key not found in credentials (zaiApiKey)");
  }
  const client = new OpenAI({
    apiKey: creds.apiKey,
    baseURL: creds.baseUrl || DEFAULT_BASE_URL,
  });

  // ── Tools (MCP) ──────────────────────────────────────────────────────────
  const mcpConfig = await discoverMCPTools(executionContext, logger, executionContext?.api);
  const tools = mcpConfig?.tools && mcpConfig.tools.length > 0 ? mcpConfig.tools : undefined;
  const mcpService = mcpConfig?.mcpService || {};

  // ── System prompt assembly ───────────────────────────────────────────────
  let systemPrompt = config.systemPrompt || "";
  if (mcpConfig?.instructions) {
    systemPrompt = systemPrompt ? `${systemPrompt}\n\n${mcpConfig.instructions}` : mcpConfig.instructions;
  }
  if (tools && config.enablePreambles !== false) {
    systemPrompt += "\n\nBefore you call a tool, briefly explain why you are calling it.";
  }
  if (!tools) {
    systemPrompt +=
      "\n\nTools are unavailable in this environment. Do not call tools. Provide the best possible direct answer to the user.";
  }
  if (config.enableMarkdown) {
    systemPrompt +=
      "\n\nUse Markdown formatting where semantically correct (e.g., `inline code`, ```code fences```, lists, tables).";
  }

  // ── Memory-first context — harness builders only (mirrors OpenAIAgent) ──────
  // When this GLM agent is the harness BUILDER (its toolset includes saveWorkflow), its
  // source of truth is the GOAL BOARD, not its own chat thread. The thread is still replayed
  // for continuity, but on a repair turn its last line is often "I'm done" and the incoming
  // user prompt can be empty — which makes GLM 400 ("prompt parameter was not received
  // normally"). So, on every run, code (never the LLM's discretion) reads the goal board and
  // LEADS the user turn with the master context: goal, locked bar, plan/progress, what was
  // already tried, and — if the judge rejected the last build — the exact blockers to fix.
  // GATED to harness builders (saveWorkflow present); a plain chat agent must not get this
  // goal/rebuild framing. Requires Agent Memory enabled (getGoalContext is only injected then).
  let runPrompt = config.prompt || "";
  const isHarnessBuilder = typeof mcpService?.saveWorkflow === "function";
  if (isHarnessBuilder && typeof mcpService?.getGoalContext === "function") {
    try {
      const goalCtx = await mcpService.getGoalContext({});
      const master = buildMasterContext(goalCtx);
      if (master) {
        runPrompt = runPrompt ? `${master}\n\n---\n\n${runPrompt}` : master;
        const blockerCount = Array.isArray(goalCtx?.state?.blockers) ? goalCtx.state.blockers.length : 0;
        logger.info(`[GLMAgent] Led prompt with goal-board master context (${blockerCount} open blocker(s))`);
      }
    } catch (e) {
      logger.warn(`[GLMAgent] Goal-context read failed (continuing): ${(e as Error).message}`);
    }
  }

  // Build the messages array: fresh system prompt each turn + prior turns + new user message.
  const messages: ChatMessage[] = [];
  if (systemPrompt.trim()) messages.push({ role: "system", content: systemPrompt });
  messages.push(...history);
  messages.push({ role: "user", content: runPrompt });

  // ── Streaming emitters ───────────────────────────────────────────────────
  let accumulatedText = "";
  let accumulatedReasoning = "";
  let lastTextEmit = 0;
  let lastReasoningEmit = 0;
  let progressLog = "";

  const emitChunk = (force = false) => {
    if (force || accumulatedText.length - lastTextEmit >= EMIT_THRESHOLD_CHARS) {
      lastTextEmit = accumulatedText.length;
      emit({ __outputs: { chunk: accumulatedText } });
    }
  };
  const emitReasoning = (force = false) => {
    if (force || accumulatedReasoning.length - lastReasoningEmit >= REASONING_EMIT_THRESHOLD_CHARS) {
      lastReasoningEmit = accumulatedReasoning.length;
      emit({ __outputs: { reasoning: accumulatedReasoning } });
    }
  };
  const emitProgress = (text: string) => {
    progressLog += text;
    emit({ __outputs: { progress: progressLog } });
  };

  // GLM-5.2 reasoning controls (extra body params on the chat endpoint).
  // Only three behaviours exist: high (default), max, and off — GLM collapses the other documented
  // values (xhigh→max, low/medium→high, minimal→off), so the node only exposes these three. "none"
  // disables thinking; reasoning_effort is ignored by GLM unless thinking.type === "enabled".
  // We set the `thinking` object explicitly so the disabled case is unambiguous across GLM versions.
  const reasoningEffort = config.reasoningEffort || "high";
  const thinkingEnabled = reasoningEffort !== "none" && reasoningEffort !== "minimal";
  const extraParams: Record<string, any> = {
    thinking: { type: thinkingEnabled ? "enabled" : "disabled" },
    reasoning_effort: reasoningEffort,
  };

  const maxTurns = config.maxTurns || 15;
  let usage: any = undefined;

  // ── Agent loop ───────────────────────────────────────────────────────────
  try {
    for (let turn = 0; turn < maxTurns; turn++) {
      const stream = (await client.chat.completions.create({
        model: config.model,
        messages: messages as any,
        stream: true,
        stream_options: { include_usage: true },
        max_tokens: config.maxTokens || 65536,
        temperature: config.temperature ?? 1.0,
        top_p: config.topP ?? 0.95,
        // GLM only streams tool_calls deltas when tool_stream is set alongside stream:true.
        // Without it, a streaming completion never emits tool_calls — the loop would see zero
        // tool calls and treat every turn as a final answer, so MCP tools never execute.
        // (Per https://docs.z.ai/guides/capabilities/stream-tool)
        ...(tools ? { tools, tool_choice: "auto", tool_stream: true } : {}),
        ...extraParams,
      } as any)) as any;

      let turnText = "";
      const toolCallsAcc: Record<number, { id: string; name: string; args: string }> = {};

      // ── DIAGNOSTIC (temporary): capture exactly what GLM streams per turn so we can
      // distinguish (a) tool_calls in an unparsed shape, (b) finish_reason=length, (c) only-reasoning.
      let diagToolDeltaCount = 0;
      let diagReasoningChars = 0;
      let diagContentChars = 0;
      let diagFinishReason: string | undefined;
      let diagSampledKeys = "";

      for await (const chunk of stream) {
        if (chunk.usage) usage = chunk.usage;
        const choice = chunk.choices?.[0];
        if (choice?.finish_reason) diagFinishReason = choice.finish_reason;
        const delta = choice?.delta;
        if (!delta) continue;
        if (!diagSampledKeys) diagSampledKeys = Object.keys(delta).join(",");

        if (typeof delta.content === "string" && delta.content) {
          turnText += delta.content;
          accumulatedText += delta.content;
          diagContentChars += delta.content.length;
          emitChunk();
        }

        // GLM streams chain-of-thought in `reasoning_content`. We accumulate it and emit the full
        // accumulated string as a throttled partial (REASONING_EMIT_THRESHOLD_CHARS) so the connected
        // display node renders live thinking — same contract as OpenAIAgent's ReasoningEmitter. The
        // hard throttle is deliberate: GLM's dense max-effort reasoning at the old 24-char threshold
        // flooded downstream re-executions and could stall completion.
        const rc = (delta as any).reasoning_content;
        if (typeof rc === "string" && rc) {
          accumulatedReasoning += rc;
          diagReasoningChars += rc.length;
          emitReasoning();
        }

        if (Array.isArray(delta.tool_calls)) {
          diagToolDeltaCount += delta.tool_calls.length;
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            const cur = (toolCallsAcc[idx] ||= { id: "", name: "", args: "" });
            if (tc.id) cur.id = tc.id;
            if (tc.function?.name) cur.name = tc.function.name;
            if (tc.function?.arguments) cur.args += tc.function.arguments;
          }
        }
      }

      const toolCalls = Object.values(toolCallsAcc).filter((t) => t.name);

      logger.info(
        `[GLMAgent][diag] turn=${turn} finish_reason=${diagFinishReason} tool_call_deltas=${diagToolDeltaCount} ` +
          `parsed_tool_calls=${toolCalls.length} content_chars=${diagContentChars} reasoning_chars=${diagReasoningChars} ` +
          `first_delta_keys=[${diagSampledKeys}] tool_stream_sent=${!!tools} max_tokens=${config.maxTokens || 65536}`,
      );

      // No tool calls → this turn is the final answer.
      if (toolCalls.length === 0) {
        messages.push({ role: "assistant", content: turnText });
        break;
      }

      // Record the assistant tool-call turn, then execute each tool.
      messages.push({
        role: "assistant",
        content: turnText || null,
        tool_calls: toolCalls.map((t) => ({
          id: t.id,
          type: "function",
          function: { name: t.name, arguments: t.args || "{}" },
        })),
      });

      for (const t of toolCalls) {
        let args: any = {};
        try {
          args = t.args ? JSON.parse(t.args) : {};
        } catch {
          logger.warn(`[GLMAgent] Could not parse args for ${t.name}; passing raw string`);
          args = t.args;
        }
        emitProgress(`Calling: ${t.name}...\n`);
        let resultStr: string;
        try {
          const fn = mcpService[t.name];
          const result = fn ? await fn(args) : { error: `Unknown tool: ${t.name}` };
          resultStr = typeof result === "string" ? result : JSON.stringify(result);
          emit({ __outputs: { mcpResult: { name: t.name, arguments: args, result } } });
        } catch (e) {
          resultStr = JSON.stringify({ error: (e as Error).message });
          logger.warn(`[GLMAgent] Tool ${t.name} failed: ${(e as Error).message}`);
        }
        emitProgress(`Done.\n`);
        messages.push({ role: "tool", tool_call_id: t.id, content: resultStr });
      }

      // Turn-limit guard: ran out of turns with tools still pending.
      if (turn === maxTurns - 1) {
        return finalize(true, "max_turns");
      }
    }

    return finalize(false);
  } catch (error: any) {
    const errMsg = error?.message || "GLM agent execution failed";
    logger.error(`[GLMAgent] Error: ${errMsg}`, { name: error?.name });
    return {
      __outputs: {
        chunk: `Error: ${errMsg}`,
        text: `Error: ${errMsg}`,
        progress: progressLog || undefined,
      },
    };
  }

  // ── Finalize: flush streams, persist history, save token usage ────────────
  async function persistHistory(): Promise<ChatMessage[]> {
    // Persist everything except the (regenerated-each-turn) system prompt.
    const toSave = messages.filter((m) => m.role !== "system");
    if (redis && redisKey) {
      try {
        await redis.setex(redisKey, 30 * 60, JSON.stringify(toSave));
        logger.info(`[GLMAgent] Saved conversation (${toSave.length} messages)`);
      } catch (e) {
        logger.warn(`[GLMAgent] Redis save failed: ${(e as Error).message}`);
      }
    }
    return toSave;
  }

  function finalize(incomplete: boolean, stopReason?: string): GLMAgentOutput {
    emitChunk(true);
    emitReasoning(true); // flush any reasoning tail below the throttle threshold

    let text = accumulatedText.trim();
    if (incomplete) {
      const notice = `[Incomplete: reached the ${maxTurns}-turn limit before finishing. Reply "continue" to resume.]`;
      text = text ? `${text}\n\n${notice}` : notice;
    }

    // Fire-and-forget side effects (history + token usage); don't block the return.
    void persistHistory();
    if (usage?.total_tokens > 0 && executionContext?.api?.saveTokenUsage) {
      void executionContext.api
        .saveTokenUsage({
          workflowId: executionContext.workflow?.id,
          executionId: executionContext.executionId,
          nodeId: executionContext.nodeId,
          nodeType: "GLMAgent",
          model: config.model,
          usage,
          timestamp: new Date(),
        })
        .catch((e: any) => logger.warn(`[GLMAgent] Token usage save failed: ${e?.message}`));
    }

    const savedHistory = messages.filter((m) => m.role !== "system");
    return {
      __outputs: {
        chunk: accumulatedText,
        text,
        progress: progressLog || undefined,
        reasoning: accumulatedReasoning.trim() || undefined,
        history: savedHistory,
        ...(incomplete ? { incomplete: true, stopReason } : {}),
      },
    };
  }
}

/**
 * Compose the goal-board "master context" that LEADS a harness builder's user turn.
 * Mirrors OpenAIAgent.buildMasterContext — the goal board, not the chat thread, is the
 * builder's source of truth, so this is what the agent starts each turn on.
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
