/**
 * Thinking Line Generation
 *
 * Generates the short, customer-safe "thinking" status line that streams out
 * the agent nodes' `thinking` output connector — replacing the old `progress`
 * log of canned/raw strings ("Calling: getChunksByQuery...").
 *
 * A super-light nano-tier model writes one natural sentence describing
 * what is being checked or confirmed, via the Responses API with a strict
 * JSON schema. Calls are fired without awaiting so they never block the main
 * model's stream; on any failure a canned fallback line is returned so the
 * connector always emits something.
 */

const THINKING_MODEL = "gpt-5.4-nano";
const THINKING_TIMEOUT_MS = 4000;

const INSTRUCTIONS = `You are writing the short status line a virtual assistant shows the customer while it prepares its reply — the visible "thinking" line above the answer.

The line must:
- Be one sentence only, 6–12 words.
- Sound like the assistant getting on with the task: what it is checking, confirming, or looking into.
- Use natural, warm, present-tense assistant voice.
- NEVER be commentary about the customer's message itself (never "what X refers to", "the message says", "you mentioned").
- NEVER quote or repeat the customer's words.
- NEVER repeat abbreviations, acronyms, brand names, or product names from the message.
- Avoid assumptions about the customer's goal, preference, eligibility, or situation.
- Avoid phrases like "the message is brief", "I asked", "I need to understand", or "before answering".
- No private chain-of-thought, no step-by-step reasoning.
- Never mention tool, system, or service names.
- No label such as "Reasoning summary:".

Good examples:
- Okay, let me check the right support route.
- Let me clarify what help you need today.
- I'll confirm the relevant options for your request.
- Checking the best next step for this query.
- Let me review the available support options.
- I'll check the right process to follow.

Bad examples:
- Confirming what "hello" refers to for your query.
- The message is very brief, so I asked a few questions.
- I am reasoning about what the user might want.
- The user may be looking for a course or qualification.
- I need to infer their goal before answering.
- Reasoning summary: I checked the available options.`;

const THINKING_SCHEMA = {
  type: "object",
  properties: {
    reasoning_text: {
      type: "string",
      description: "One short, customer-safe thinking/status sentence (6-12 words)",
    },
  },
  required: ["reasoning_text"],
  additionalProperties: false,
};

const TURN_START_FALLBACK = "Let me look into this for you...";
const TOOL_CALL_FALLBACK = "Checking the best next step...";

// Instant lines: emitted synchronously at turn start (0ms, no API call) so the
// thinking row is visible BEFORE the main model's first token — the nano line
// replaces it ~1s later. The API round trip has a ~1s floor (measured across
// models; gpt-4.1-nano is slower than gpt-5.4-nano, schema overhead negligible),
// so beating the stream reliably requires a local line first.
const INSTANT_LINES = [
  "Let me look into this for you...",
  "Okay, one moment while I check...",
  "Let me see how I can help...",
  "Just a second while I look at this...",
  "Checking the best way to help you...",
];

export function instantThinkingLine(): string {
  return INSTANT_LINES[Math.floor(Math.random() * INSTANT_LINES.length)];
}

export type ThinkingEvent =
  | { kind: "turn_start"; userMessage: string }
  | { kind: "tool_call"; toolName: string; args?: any };

function truncate(str: string, maxLen: number): string {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

function buildInput(event: ThinkingEvent): string {
  if (event.kind === "turn_start") {
    return `For topical context only (do NOT quote or reference it), the customer's message was:\n"""${truncate(event.userMessage || "", 500)}"""\n\nWrite the status line the assistant shows while preparing its reply.`;
  }
  let argsText = "";
  try {
    argsText = event.args ? truncate(JSON.stringify(event.args), 300) : "";
  } catch {
    /* unserializable args add nothing */
  }
  return `The assistant is now looking something up for the customer using an internal capability named "${event.toolName}"${
    argsText ? ` with input ${argsText}` : ""
  }.\n\nWrite the thinking line describing what is being checked or done (never name the capability).`;
}

/**
 * Generate one thinking line. Never throws and never hangs past the timeout —
 * on any failure it resolves to a canned fallback so the caller can always emit.
 */
export async function generateThinkingLine(
  event: ThinkingEvent,
  openai: any,
  logger?: any,
  executionContext?: { workflowId?: string; executionId?: string; nodeId?: string; nodeType?: string; api?: any }
): Promise<string> {
  const fallback = event.kind === "turn_start" ? TURN_START_FALLBACK : TOOL_CALL_FALLBACK;

  try {
    const response = await openai.responses.create(
      {
        model: THINKING_MODEL,
        input: [{ role: "user", content: buildInput(event) }],
        instructions: INSTRUCTIONS,
        text: {
          format: {
            type: "json_schema",
            name: "thinking_line",
            strict: true,
            schema: THINKING_SCHEMA,
          },
          verbosity: "low",
        },
      },
      { timeout: THINKING_TIMEOUT_MS }
    );

    // Save token usage attributed to the calling agent node (best effort)
    if (executionContext?.api?.saveTokenUsage && response?.usage) {
      executionContext.api
        .saveTokenUsage({
          workflowId: executionContext.workflowId,
          executionId: executionContext.executionId,
          nodeId: executionContext.nodeId,
          nodeType: executionContext.nodeType || "ThinkingLine",
          model: THINKING_MODEL,
          usage: response.usage,
          timestamp: new Date(),
        })
        .catch(() => {});
    }

    const parsed = JSON.parse(response.output_text || "{}");
    const line = typeof parsed.reasoning_text === "string" ? parsed.reasoning_text.trim() : "";
    return line || fallback;
  } catch (e: any) {
    logger?.warn?.(`[ThinkingLine] Generation failed (using fallback): ${e?.message}`);
    return fallback;
  }
}
