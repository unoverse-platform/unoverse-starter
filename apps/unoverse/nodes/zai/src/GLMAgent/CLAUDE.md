# GLMAgent Node — Specification

A `CallbackNode` agent on **GLM-5.2 (Z.AI)**. Modeled on the OpenAI Agent (`../../../openai/src/OpenAIAgent`) — same outputs, MCP tool consumption, streaming-via-`emit`, and multi-turn — but runs on Z.AI's OpenAI-compatible **chat-completions** API instead of the OpenAI **Responses** API.

## Why it diverges from OpenAIAgent

| Concern | OpenAIAgent | GLMAgent |
|--------|-------------|----------|
| API surface | Responses API via `@openai/agents` SDK | Chat Completions via `openai` client + `baseURL` |
| Agent loop | SDK-managed (`run()`) | Hand-rolled tool-calling loop (`runGLMAgent`) |
| Multi-turn | `previous_response_id` (server-side) | full `messages[]` replayed (no response IDs on GLM) |
| Reasoning | `reasoning.effort` + summary events | GLM `reasoning_effort` + `delta.reasoning_content` |
| Tracing | platform.openai.com | none (third-party endpoint) |

GLM has **no `previous_response_id`**, so conversation state is the entire `messages[]`
array persisted to Redis (`zai:conv:{workflowId}:{conversationId}:{userId}`, 30-min TTL),
with an in-process executor-state fallback when there is no conversation key.

## Architecture

```
GLMAgent/
├── node/
│   ├── index.ts        # EnhancedNodeDefinition (configSchema, credentials, serviceConnectors)
│   └── executor.ts     # CallbackNode: EXECUTE / CONTINUE, loop safety
├── service/
│   ├── runGLMAgent.ts  # client init, MCP tools, streaming tool-calling loop, Redis history
│   ├── mcpDiscovery.ts # getSchema → chat-completions tool defs + proxy callers
│   └── index.ts
└── util/types.ts
```

## MCP

Tools are consumed through the `mcpService` service connector (`serviceType: "mcp",
isService: false`) — identical to OpenAIAgent. `discoverMCPTools` calls
`api.callService("getSchema", …)` to enumerate methods, emits Chat-Completions tool defs
(`{ type:"function", function:{ name, description, parameters } }`), and wires a proxy that
re-enters `api.callService(method, args, ctx)` on each call.

Discovery + skill-loading are functionally identical to OpenAIAgent (`shared/openaiStream/mcp/
toolDiscovery`): `getSchema` returns only the 4 core MCPs (`findIntent`, `discoverRelated`,
`readSkill`, `readSkillFile`) **plus `mcpSchema.instructions`** (appended to the system prompt).
There is no static skill preload — **skills are loaded at runtime by the agent CALLING tools**
(`findIntent`/`discoverRelated` to find workflow MCPs, `readSkill`/`readSkillFile` to pull skill
content). So nothing the agent does — skills, goal-board memory, saveWorkflow — works unless tool
calling works.

⚠️ **`tool_stream: true` is REQUIRED.** GLM only streams `tool_calls` deltas when `tool_stream`
is set alongside `stream: true` (https://docs.z.ai/guides/capabilities/stream-tool). The OpenAI
SDK streams tool calls natively; GLM does not. Without `tool_stream`, the hand-rolled loop sees
`delta.tool_calls` empty, `toolCalls.length === 0`, treats every turn as a final text answer, and
NEVER executes a tool — so findIntent/readSkill/getGoalContext/saveWorkflow all silently no-op
even though the model "decided" to call them in its reasoning. Sent in `runGLMAgent` only when
tools are present; the args accumulator (`cur.args += function.arguments`, keyed by `index`) is
already correct for the streamed shape.

## GLM-5.2 API params (per https://docs.z.ai/guides/llm/glm-5.2)

- `temperature` default **1.0** (0–1), `top_p` default **0.95** (0.01–1).
- `max_tokens` up to **131072** (128K).
- **Models**: `glm-5.2` (deepest reasoning, default) and `glm-5-turbo` (faster/cheaper, 200K
  context). Turbo supports `thinking` on/off but **not** `reasoning_effort` (GLM-5.2+ only), so
  on Turbo High and Max behave identically (both just `thinking: enabled`); Off still disables.
- `reasoning_effort` (**GLM-5.2 only**): GLM collapses the seven documented values into three real
  behaviours (`xhigh`→`max`, `low`/`medium`→`high`, `minimal`/`none`→skip), and per the docs it
  **only takes effect when `thinking.type === "enabled"`**. So the node deliberately exposes ONLY
  the three distinct outcomes — **`high` (default) / `max` / `none` (Off)** — to stop users picking
  e.g. "Low" expecting fewer tokens and getting full `high` reasoning. `thinking.type` is set
  explicitly (`disabled` when effort is `none`/`minimal`), which is the only true off switch.
- `tool_choice: "auto"` is the only accepted value (do **not** send `parallel_tool_calls`).
- Reasoning streams in `delta.reasoning_content`; text in `delta.content`.

## Loop safety

| Layer | Safeguard | Default |
|-------|-----------|---------|
| Executor | MAX_CONTINUE_COUNT | 50 |
| Executor | SESSION_TIMEOUT_MS | 30 min |
| Service | `maxTurns` (tool loop) | 15 |

Hitting `maxTurns` mid-task returns an `incomplete: true` / `stopReason: "max_turns"` result
with the partial text and persisted history so `"continue"` resumes.
