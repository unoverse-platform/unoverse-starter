# @unoverse-platform/zai

Z.AI (GLM) integration for the Gravity workflow system.

## Nodes

### GLM Agent (`GLMAgent`)

A multi-turn agent powered by **GLM-5.2** (Z.AI), mirroring the OpenAI Agent's shape and
platform integration but running on Z.AI's OpenAI-compatible **chat-completions** API
(`https://api.z.ai/api/paas/v4`).

- **MCP tool calling** — consumes tools from any MCP provider node attached via a service
  edge (same `serviceConnectors` mechanism as the OpenAI Agent). Tools are auto-discovered
  through `getSchema`.
- **Streaming** — text streams to `chunk`, GLM's chain-of-thought streams to `reasoning`,
  tool calls log to `progress`, and tool results surface on `mcpResult`.
- **Multi-turn** — the running `messages[]` conversation is persisted to Redis per
  `workflowId:conversationId:userId` (30-min sliding TTL), with an in-process state
  fallback. GLM has no `previous_response_id`, so history is replayed explicitly.
- **Reasoning control** — `reasoningEffort` maps to GLM-5.2's `reasoning_effort`
  (`none` disables thinking, `high` is the baseline, `max` is the deepest).

Say **"reset conversation"** to clear the stored history.

## Credentials

| Credential | Type | Notes |
|-----------|------|-------|
| Z.AI API Key | `zaiApiKey` | `apiKey` (required) + optional `baseUrl` override |

## Optimal GLM-5.2 usage (per [z.ai docs](https://docs.z.ai/guides/llm/glm-5.2))

| Param | Value | Source |
|-------|-------|--------|
| `temperature` | default `1.0` (range 0–1) | GLM-5.2 default |
| `top_p` | default `0.95` (range 0.01–1) | GLM-5.2 default |
| `max_tokens` | `4096` default, up to `131072` | 128K max output |
| `reasoning_effort` | `none` / `high` / `max` (GLM-5.2-only) | `low`/`medium`→`high`, `xhigh`→`max` internally |
| `thinking.type` | `enabled` unless effort is `none` | explicit for cross-version clarity |
| `tool_choice` | `"auto"` | only value GLM accepts |

## Development

```bash
cd packages-marketplace
npm install
cp zai/.env.example zai/.env   # add your ZAI_API_KEY
npm run build -w @unoverse-platform/zai
npm test -w @unoverse-platform/zai   # skipped without ZAI_API_KEY
```
