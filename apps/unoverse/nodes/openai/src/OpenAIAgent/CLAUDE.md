# OpenAIAgent Node — Specification

## Overview

A new CallbackNode that wraps the **OpenAI Agents SDK** (`@openai/agents`). It replaces the custom conversation loop (`runConversationLoop`) with the SDK's native agent harness while keeping the same platform integration points: MCP service consumption, streaming via `emit()`, Focus Mode multi-turn, and credential management.

## Why (not just ChatGPTAgent)

- **SDK manages the agent loop** — tool dispatch, retries, state handled by the SDK rather than our custom code
- **Multi-agent handoffs** — SDK's `handoff()` primitive lets multiple agents collaborate inside one node (v2)
- **Durable execution** — SDK state snapshotting/rehydration via `result.state` (v2)
- **Sandbox execution** — code running in isolated environments (v2)
- **Simpler service layer** — less custom plumbing, the SDK is the harness
- **Tracing built-in** — automatic traces viewable at platform.openai.com/traces

## Architecture

```
OpenAIAgent/
├── CLAUDE.md            # This file
├── node/
│   ├── index.ts         # EnhancedNodeDefinition + export
│   └── executor.ts      # CallbackNode: handleEvent (EXECUTE/CONTINUE)
├── service/
│   ├── index.ts         # Barrel export
│   └── runOpenAIAgent.ts  # Initialize SDK Agent, wire tools, run, stream
└── util/
    └── types.ts         # Config, State, Output interfaces
```

## Node Type

**CallbackNode** — required for:
- Multi-turn conversation (Focus Mode CONTINUE signals)
- Streaming progress via `emit()` during execution
- Yielding execution while waiting for user input

## Platform Integration

### MCP Service Connector (same as ChatGPTAgent)

```typescript
serviceConnectors: [
  {
    name: "mcpService",
    description: "MCP service connector - automatic schema discovery",
    serviceType: "mcp",
    isService: false, // CONSUMES MCP services
  },
]
```

Any MCP provider node connected on the canvas (SpatialSearch, PostgresFetch, etc.) is discovered via `discoverMCPTools()` and passed to the SDK agent as tools.

### Credentials

```typescript
credentials: [
  { name: "openAICredential", required: true, displayName: "OpenAI API" },
]
```

Uses the same OpenAI credential type as other nodes in this package.

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `chunk` | STRING | Streaming LLM text (emitted in real-time) |
| `text` | STRING | Final complete response |
| `thinking` | STRING | Short customer-safe thinking status lines, written by a nano model (emitted in real-time) |
| `reasoning` | STRING | Model reasoning/thinking |
| `mcpResult` | OBJECT | MCP tool results |

### Inputs

| Input | Type | Description |
|-------|------|-------------|
| `signal` | OBJECT | Data from upstream nodes (referenced in templates) |

## SDK Integration (`@openai/agents`)

### Package

```bash
npm install @openai/agents zod
```

### Core Flow

```typescript
import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";

// 1. Discover MCP tools from connected nodes on the canvas
const mcpConfig = await discoverMCPTools(executionContext, logger, undefined, api);

// 2. Bridge MCP tools → SDK tool() format
const sdkTools = bridgeMCPToSDKTools(mcpConfig.tools, mcpConfig.mcpService, logger);

// 3. Create SDK Agent
const agent = new Agent({
  name: config.agentName || "GravityAgent",
  model: config.model,
  instructions: config.systemPrompt,
  tools: sdkTools,
});

// 4. Run with streaming
const stream = await run(agent, config.prompt, {
  stream: true,
  previousResponseId, // For multi-turn conversation continuity
});

// 5. Stream events back via emit()
for await (const event of stream) {
  if (event.type === "raw_model_stream_event" && event.data.type === "response.output_text.delta") {
    textEmitter.append(event.data.delta);
  }
}

await stream.completed;
const finalOutput = stream.finalOutput;
const responseId = stream.lastResponseId; // Save for multi-turn
```

### Tool Bridging: Platform MCP → SDK tool()

The SDK uses `tool()` from `@openai/agents` with Zod schemas. We bridge from our MCP discovery:

```typescript
import { tool } from "@openai/agents";
import { z } from "zod";

function bridgeMCPToSDKTools(mcpTools: any[], mcpService: any, logger: any) {
  return mcpTools.map((mcpTool) => {
    // Convert JSON Schema parameters to a Zod passthrough schema
    // (SDK accepts z.object({}).passthrough() for dynamic schemas)
    return tool({
      name: mcpTool.function.name,
      description: mcpTool.function.description || "",
      parameters: z.object({}).passthrough(), // Accept any args, MCP validates
      async execute(args) {
        const result = await mcpService.callTool(mcpTool.function.name, args);
        return JSON.stringify(result);
      },
    });
  });
}
```

### Streaming Events → emit()

The SDK stream emits `raw_model_stream_event` events. Map to our platform:

```typescript
for await (const event of stream) {
  if (event.type === "raw_model_stream_event") {
    const data = event.data;
    
    if (data.type === "response.output_text.delta") {
      // Text streaming → chunk output
      textEmitter.append(data.delta);
    }
    
    // Tool call events → progress output
    if (data.type === "response.function_call_arguments.start") {
      emitProgress(`Calling: ${data.name}...\n`);
    }
    if (data.type === "response.function_call_arguments.done") {
      emitProgress(`Done.\n`);
    }
  }
}

await stream.completed;
// stream.finalOutput = final text or structured output
// stream.lastResponseId = for multi-turn
```

### Multi-Turn (Conversation Persistence)

Two options available from the SDK:

**Option A: `previousResponseId` (lightweight, current approach)**
- Same Redis pattern as ChatGPTAgent
- Key: `openai:conv:{workflowId}:{conversationId}:{userId}`
- 30-minute sliding TTL
- Pass to `run()` as `{ previousResponseId }`

**Option B: `MemorySession` (SDK convenience wrapper, not used)**

The SDK's `MemorySession`/`SQLiteSession` are just in-process wrappers around the same `previousResponseId` chain. They add no real memory capability (no summarization, fact extraction, or cross-session recall). Our Redis approach is superior for this architecture: distributed, survives process cycling, explicit TTL, works across horizontal scaling.

v1 uses Option A. No plan to adopt MemorySession.

## Executor Pattern

```typescript
// executor.ts
import { getPlatformDependencies, type ValidationResult } from "@unoverse-platform/plugin-base";
import { runOpenAIAgent } from "../service";
import type { OpenAIAgentConfig, OpenAIAgentState } from "../util/types";

const { CallbackNode } = getPlatformDependencies();

const MAX_CONTINUE_COUNT = 50;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export default class OpenAIAgentExecutor extends CallbackNode {
  constructor() { super("OpenAIAgent"); }

  initializeState(inputs: any): OpenAIAgentState {
    return { chunk: "", text: "", hasStartedStreaming: false, continueCount: 0 };
  }

  async handleEvent(event, state, emit) {
    const config = event.config as OpenAIAgentConfig;
    const executionContext = (this as any).executionContext;
    const credentialContext = this.buildCredentialContext(executionContext);

    if (event.type === "CONTINUE") {
      // Loop safety: max continues + session timeout
      const continueCount = (state.continueCount || 0) + 1;
      if (continueCount > MAX_CONTINUE_COUNT) {
        return { ...state, isComplete: true };
      }

      const userMessage = /* extract from event.inputs.continue */;

      const result = await runOpenAIAgent(
        { ...config, prompt: userMessage },
        credentialContext, this.logger, executionContext, emit,
        state.responseId,
      );
      emit(result);

      if (result.__outputs?.focusInputRequired) {
        return { ...state, responseId: result.__outputs.responseId, continueCount };
      }
      return { ...state, ...result.__outputs, isComplete: true };
    }

    // EXECUTE - first run
    if (state.hasStartedStreaming) return state; // Ignore duplicate

    const result = await runOpenAIAgent(config, credentialContext, this.logger, executionContext, emit);
    emit(result);

    if (result.__outputs?.focusInputRequired) {
      return { ...state, hasStartedStreaming: true, responseId: result.__outputs.responseId };
    }
    return { ...state, ...result.__outputs, hasStartedStreaming: true, isComplete: true };
  }
}
```

## Loop Safety

| Layer | Safeguard | Default |
|-------|-----------|---------|
| Executor | MAX_CONTINUE_COUNT | 50 |
| Executor | SESSION_TIMEOUT_MS | 30 min |
| SDK `run()` | `maxTurns` option | Configurable (default 15) |
| Platform | CallbackNode yield timeout | 10 min |

## Config Schema

```typescript
configSchema: {
  properties: {
    model: {
      type: "string",
      enum: ["gpt-5.5", "gpt-5.4-mini", "gpt-5.2", "gpt-5.2-pro"],
      enumNames: ["GPT-5.5 (Latest)", "GPT-5.4 Mini (Fast)", "GPT-5.2", "GPT-5.2 Pro (Deep reasoning)"],
      default: "gpt-5.5",
    },
    agentName: {
      type: "string",
      title: "Agent Name",
      description: "Name for this agent (appears in traces)",
      default: "GravityAgent",
    },
    systemPrompt: {
      type: "string",
      title: "Instructions",
      description: "Agent instructions (system prompt). Supports {{input.fieldName}} templates.",
      "ui:field": "template",
      "ui:ai": { editable: true },
    },
    prompt: {
      type: "string",
      title: "User Prompt",
      description: "User message. Supports {{input.fieldName}} templates.",
      "ui:field": "template",
      "ui:ai": { editable: true },
    },
    maxTurns: {
      type: "number",
      title: "Max Turns",
      description: "Maximum agent loop iterations (tool calls + responses)",
      default: 15,
      minimum: 1,
      maximum: 50,
    },
    reasoningEffort: {
      type: "string",
      enum: ["none", "low", "medium", "high"],
      default: "medium",
    },
  },
  required: ["model", "prompt"],
  "ui:order": ["model", "agentName", "reasoningEffort", "maxTurns", "systemPrompt", "prompt"],
}
```

## Agent-to-Agent Connection (Pattern 1: MCP)

Another OpenAIAgent (or ChatGPTAgent) can expose itself as an MCP provider:

```typescript
// v2: add a second service connector
serviceConnectors: [
  { name: "mcpService", serviceType: "mcp", isService: false },  // consumer (always)
  { name: "agentMCP", serviceType: "mcp", isService: true },     // provider (optional, v2)
]
```

When `isService: true`, this node's capabilities are discoverable by other agent nodes connected to it on the canvas. Enables agent-to-agent delegation. **Deferred to v2.**

## SDK Features Used in v1

| SDK Feature | Used | Notes |
|-------------|------|-------|
| `Agent` constructor | ✅ | name, model, instructions, tools |
| `run()` with streaming | ✅ | `{ stream: true }` |
| `tool()` | ✅ | Bridge MCP tools |
| `previousResponseId` | ✅ | Multi-turn via Redis |
| `stream.finalOutput` | ✅ | Final response text |
| `stream.lastResponseId` | ✅ | Save for next turn |
| `handoff()` | ❌ v2 | Multi-agent inside node |
| `MemorySession` | ❌ v2 | SDK-managed sessions |
| `MCPServerStdio` | ❌ | We use our own MCP discovery |
| `outputType` (Zod) | ❌ v2 | Structured output |
| `result.state` | ❌ v2 | Durable execution |

## Versioning / Roadmap

### v1 (Now)
- CallbackNode with EXECUTE/CONTINUE
- SDK `Agent` + `run()` with streaming
- MCP tool bridging via `tool()` wrappers
- Multi-turn via Redis + `previousResponseId`
- Same outputs as ChatGPTAgent
- Tracing enabled by default

### v2 (Later)
- `handoff()` — define sub-agents in config, SDK routes between them
- Agent-as-MCP-provider — other nodes call this agent as a tool
- `outputType` — structured output via Zod schemas
- `MemorySession` — SDK-managed conversation state
- Sandbox execution
- Durable execution via `result.state`

## Dependencies

```json
{
  "@openai/agents": "^1.x",
  "zod": "^3.x"
}
```

Also uses existing shared modules:
- `discoverMCPTools` — from `../../shared/openaiStreamEngine`
- `initializeOpenAIClient` — credential resolution (may not be needed if SDK reads OPENAI_API_KEY)
- `TextEmitter`, `ReasoningEmitter` — from `../../shared/openaiStreamEngine`
- `formatToolFeedback` — from `../../shared/toolFeedback`

Platform:
- `@unoverse-platform/plugin-base` — CallbackNode via `getPlatformDependencies()`

## Resolved: API Key Injection

The SDK provides `setDefaultOpenAIClient(client: OpenAI)` from `@openai/agents`. We call `initializeOpenAIClient()` (same as ChatGPTAgent) to get a credentialed `OpenAI` instance, then pass it to the SDK before `run()`:

```typescript
import { setDefaultOpenAIClient } from "@openai/agents";

const openai = await initializeOpenAIClient(context, logger, api);
setDefaultOpenAIClient(openai);
```

This keeps credential handling identical to all other OpenAI nodes.

## Open Questions

1. **Tool schema fidelity** — Using `z.object({}).passthrough()` loses parameter validation at the SDK level. Investigate if we can dynamically convert JSON Schema → Zod for better tool calling accuracy.
2. **Stream event details** — Confirm exact event types for tool call start/end so progress output is accurate.
3. **maxTurns** — Confirm this is a `run()` option (likely in `StreamRunOptions`).

## Reference

- SDK docs: https://developers.openai.com/api/docs/guides/agents
- npm: `@openai/agents`
- Existing ChatGPTAgent: `../ChatGPTAgent/` (pattern reference)
- Node creation guide: `docs-starter/nodes/CLAUDE.md`
