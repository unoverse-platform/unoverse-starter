# CLAUDE.md — Creating GravityAI Plugin Nodes

Authoritative guide for creating nodes in the GravityAI plugin system. Synthesized from `README.md` and `01-09.md` in this directory — consult those files for deeper detail on any section.

## Core architecture

Nodes are distributed as **npm packages** (`@gravityai-dev/<name>`) that register themselves with the platform via a plugin `setup()` hook. Each node splits responsibility across three layers:

- **Node definition** (`node/index.ts`) — metadata, inputs/outputs, configSchema, serviceConnectors, credentials
- **Executor** (`node/executor.ts`) — workflow-level glue; extends `PromiseNode` or `CallbackNode`
- **Service** (`service/index.ts`) — business logic, external API calls, credential fetching

```
@gravityai-dev/my-node/
├── src/
│   ├── index.ts                 # createPlugin({ setup })
│   ├── MyNode/
│   │   ├── node/
│   │   │   ├── index.ts         # createNodeDefinition + export
│   │   │   └── executor.ts      # PromiseNode | CallbackNode subclass
│   │   ├── service/index.ts     # business logic
│   │   └── util/types.ts
│   ├── shared/platform.ts       # getPlatformDependencies() (only for CallbackNode)
│   └── credentials/index.ts
└── package.json
```

## Decide the node type first

| Use case | Type |
| --- | --- |
| One input → one output (API call, transform, DB op, file op) | `PromiseNode` |
| Streaming, iteration, collections, long-running, waits for signals | `CallbackNode` |

PromiseNode can be imported directly from `@gravityai-dev/plugin-base`. CallbackNode **must** be obtained via `getPlatformDependencies()` — importing it directly causes runtime validation errors.

## PromiseNode template

```typescript
// executor.ts
import { PromiseNode, type NodeExecutionContext, type ValidationResult } from "@gravityai-dev/plugin-base";
import { myService } from "../service";

export default class MyNodeExecutor extends PromiseNode {
  constructor() { super("MyNode"); }

  protected async validateConfig(config: MyConfig): Promise<ValidationResult> {
    return { success: true }; // keep simple; let service validate details
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: MyConfig,
    context: NodeExecutionContext
  ): Promise<MyOutput> {
    const credentialContext = this.buildCredentialContext(context);
    const result = await myService(config, credentialContext, context.api);
    return { __outputs: { output: result.text, metadata: result.metadata } };
  }

  private buildCredentialContext(context: NodeExecutionContext) {
    const { workflowId, executionId, nodeId } = this.validateAndGetContext(context);
    return {
      workflowId, executionId, nodeId,
      nodeType: this.nodeType,
      config: context.config,
      credentials: context.credentials || {},
    };
  }
}
```

## CallbackNode template

```typescript
import { getPlatformDependencies, type ValidationResult } from "@gravityai-dev/plugin-base";
const { CallbackNode } = getPlatformDependencies();

export default class MyCallbackExecutor extends CallbackNode<MyConfig, MyState> {
  constructor() { super("MyCallbackNode"); }

  initializeState(inputs: any): MyState {
    return { items: [], currentIndex: 0, isComplete: false };
  }

  async handleEvent(event, state, emit): Promise<MyState> {
    const { inputs, config } = event;

    if (inputs?.continue !== undefined && state.items.length > 0) {
      if (state.currentIndex >= state.items.length) {
        return { ...state, isComplete: true };
      }
      const result = await processItem(state.items[state.currentIndex]);
      emit({ __outputs: { item: result, index: state.currentIndex,
                          hasMore: state.currentIndex < state.items.length - 1 } });
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        isComplete: state.currentIndex + 1 >= state.items.length,
      };
    }

    if (state.items.length === 0 && config?.items) {
      return { ...state, items: config.items };
    }
    return state;
  }
}
```

## Non-negotiable rules

1. **Never override `execute()`.** Implement `executeNode()` (PromiseNode) or `handleEvent()` (CallbackNode).
2. **Always wrap outputs in `__outputs`**: `return { __outputs: { ... } }`. Raw returns do not reach downstream nodes.
3. **CallbackNode: `emit()` sends outputs, `return` signals completion.** They are separate channels.
   - ✅ `emit({ __outputs: finalData }); return { isComplete: true };`
   - ❌ `return { __outputs: finalData, isComplete: true };` — outputs are LOST.
   - Missing `isComplete: true` leaks the actor and may hang the workflow.
4. **Credentials: services fetch, nodes pass context.** Never read `context.credentials.*` in an executor.
   - Executor builds a `credentialContext` and passes it + `context.api` to the service.
   - Service calls `api.getNodeCredentials(credentialContext, "<credentialName>")`.
5. **Use `context.api` — not global state.** No module-level `getPlatformDependencies()` calls except to obtain the `CallbackNode` base class itself. Module-level platform calls cause startup freezes.
6. **Use `this.logger` in executors**; pass/obtain `api.createLogger?.()` in services. Don't create ad-hoc loggers.

## Node definition essentials

```typescript
import { NodeInputType, type EnhancedNodeDefinition } from "@gravityai-dev/plugin-base";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    type: "MyNode",
    name: "My Node",
    description: "Does something useful",
    whenToUse: "AI selection guidance: when to pick this node, as a PROPERTY of its job — outcome-first, 1-2 sentences, naming no sibling (self-disqualify by property; name another node only for an absolute structural must). Surfaced in the Unoverse MCP catalog; see doc 14.",
    category: "AI", // descriptive taxonomy — match the JOB: AI | Voice | Go To Market | Search | Web Scraping | Media & Design | Documents | Knowledge & Vectors | Storage & Data | Communication | Flow | Output
    inputs: [
      { name: "input", type: NodeInputType.STRING, required: true /* signal: "EXECUTE" default */ },
    ],
    outputs: [{ name: "output", type: NodeInputType.STRING }],
    configSchema: { type: "object", properties: { /* ... */ }, required: [] },
    credentials: [{ name: "myCredential", type: "myCredentialType", required: true }],
    serviceConnectors: [
      // isService: true  → this node PROVIDES the service
      // isService: false → this node CONSUMES the service
    ],
    capabilities: { isTrigger: false },
  };
}
export const MyNodeNode = { definition: createNodeDefinition(), executor: MyNodeExecutor };
```

## Node capabilities

`capabilities` declares engine-level behavior of the node type. All optional:

| Capability | Meaning |
| --- | --- |
| `isTrigger` | Node can start a workflow (no upstream required). |
| `cacheable` | Output is safe to **memoize** — see below. |

### `cacheable` — output memoization (opt-in)

When `cacheable: true`, the engine may serve a node's persisted output from a prior run instead of re-executing it, whenever the node's **fingerprint** matches. The fingerprint is a hash of `node type + version + RESOLVED config + credential ref + scope{userId, conversationId}`. Because it hashes the *resolved* config (templates already substituted), **any upstream change, config edit, credential swap, or loop/variable change busts the cache automatically and recursively.** A TTL bounds staleness.

The win: across a build's many `runTest` cycles, the same search query or the same scrape of the same URL no longer re-runs from scratch (seconds + API spend each) when only a downstream field changed.

```typescript
capabilities: {
  isTrigger: false,
  // Idempotent read — same fingerprint yields the same result, so a prior
  // output is safe to reuse instead of re-running. See § when to set it.
  cacheable: true,
},
```

**When to set `cacheable: true`:** ONLY for idempotent, side-effect-free **reads** — web search, scrape, fetch-by-id, a pure transform. Same inputs ⇒ same output, and re-running changes nothing in the outside world.

**NEVER set it for:**
- **Effectful** nodes (send email, write DB row, post to Slack, charge a card) — reusing a prior output would silently skip the side effect.
- **Non-deterministic** nodes (LLM completions, anything time/random-dependent) — re-running is the *correct* behavior; the answer is meant to vary.

**Safety / gating** (the author opt-in is necessary but not sufficient — all must hold for a reuse to happen):
- Memoization is **OFF by default** engine-wide (`XSTATE_CONFIG.NODE_MEMOIZATION`, requires migration 008). Your `cacheable` flag only makes the node *eligible*.
- Only the **node author** reliably knows a node is an idempotent read, so the capability is the real gate — default off. `WORKFLOW_MEMOIZABLE_NODE_TYPES="TypeA,TypeB"` is a transitional env override for nodes whose definition can't be edited yet.
- Memoization can never *fail* an execution — every step is wrapped; on any error the node just executes normally.

Canonical examples: `SearchWeb` / `SearchNews` / `SearchVideos` / `SearchPlaces` (`@unoverse-platform/search`), `HyperbrowserScrape` (`@unoverse-platform/crawl`). Design rationale: `docs/unoverseCopilot/EXECUTION_EFFICIENCY.md` §3.2.

## Writing `whenToUse` (node discoverability)

`whenToUse` is AI selection guidance, surfaced to the workflow-building agent (UNO) through the Unoverse MCP catalog (`getNodeCatalog`). It is **not** a footnote — the catalog *embeds* `name. whenToUse [category]` and ranks it by semantic similarity to the step's `task`, returning only the top N. So `whenToUse` decides whether a node **surfaces at all**, not just which sibling wins. A node with weak meta is invisible to the agent no matter how well it works. **This is critical — the full guide is `14-node-discoverability.md`; read it before writing the field.** Every code node must have `whenToUse` (design-system display components are exempt).

**The essentials (see doc 14 for the full reasoning and worked examples):**

1. 1–2 sentences. Write the one-line `task` a planner would type for this node's job first, then make sure its key nouns/verbs appear in your **opening words**.
2. **Outcome first, mechanism last.** Lead with the job-to-be-done in task-query vocabulary; never open with plumbing ("Hybrid MCP node…", "Attach via a service edge…") — it sinks the ranking.
3. **Disqualify yourself by *property*, don't name the rival** (governing law: `docs/unoverseCopilot/LOGIC_PLACEMENT.md` Rule 3). Know the incumbent you'd lose to (often a different-category default — e.g. a one-shot dump into MarkdownRenderer) to sharpen the *property* that beats it — but write the **property**, not the name; the ranking surfaces the alternative. Name a node only for an **absolute structural must** (a companion/wiring dependency).
4. Service-provider / MCP nodes (`isService: true`): still **include** the wiring fact (attach **via a service edge** to a consumer; not part of the data flow) — but put it **last**, after the outcome and the property.
5. Base every claim on the code, not on what the node sounds like it does.

**Good:**

```typescript
// OpenAI — self-disqualify by property, names no sibling
whenToUse: "Single prompt → single completion — no streaming, no tools. The one-shot choice; reach elsewhere when a step needs token streaming or iterative tool use.",

// AirtableExists — the property (existence test), not the rivals
whenToUse: "Pick for a cheap existence test before an insert — branch on signal.exists, no row fetched.",

// SmartDocument (provider) — outcome first, self-disqualify by PROPERTY, companion + wiring last
whenToUse: "Pick whenever an agent must author or revise a long document — report, plan, spec, article, brief. Writes and revises section by section; a one-shot generation can't be revised and blows the context window. Attach via a service edge to an agent node, and route its markdown to a MarkdownRenderer to display.",
```

**Bad:**

```typescript
whenToUse: "Hybrid MCP node: attach via a service edge to an agent…",     // plumbing first — buries the node in the ranking
whenToUse: "Use this node when you want to call the OpenAI API.",        // restates the description — zero selection signal
whenToUse: "A powerful and flexible node for all your search needs.",    // marketing, zero selection signal
whenToUse: "Calls GET /v2/companies/enrich with retry and backoff.",     // implementation detail, not selection
```

## Template field modes (UNIVERSAL — same on every node)

A config field marked `"ui:field": "template"` resolves at runtime against the node's input context. Which syntax to use is decided by the field's **`type`** — this is universal, never per-node, so it is documented here once rather than on each node:

- **STRING** field → **Handlebars**: `"{{signal.<sourceId>.<outputHandle>.<field>}}"`, e.g. `"Summarize this: {{signal.inputtrigger1.output.message}}"`. There is NO `{{input.*}}` root — wrong paths resolve to empty silently. Array elements and object keys are **dot segments**, never brackets: `records.0.Name`, not `records[0].Name` — bracket indexing is not a valid Handlebars path and resolves to empty.
- **OBJECT / ARRAY** field → **JavaScript `return` string** with direct property access (NOT `{{}}`): the resolver runs any template string that starts with `return ` as JS. One value: `"return signal.s3files1.files"`. Built object: `"return { topic: signal.inputtrigger1.output.message, image: signal.geminiimagegen1.images[0].data }"`. A bare nested object `{ topic: "{{...}}" }` is invalid and never resolves.

The naming convention `signal.<sourceId>.<outputHandle>.<field>` is the same everywhere: your node's input connector, the upstream node id, its output connector, the field. The real available references for a given node come from its actual edges, not from any per-node example.

## configSchema quick reference

| Field type | Key options |
| --- | --- |
| string | `default`, `enum` + `enumNames`, `"ui:field": "template"` (handlebars `{{input.x}}`) |
| number | `default`, `minimum`, `maximum`, `step` |
| boolean | `default`, `"ui:widget": "toggle"` |
| object | `"ui:field": "template"` (JavaScript `return { ... }`) |
| any | `"ui:dependencies": { otherField: expectedValue }` for conditional display |

**Template type distinction:**
- `type: "string"` + `"ui:field": "template"` → handlebars, resolves to a string
- `type: "object"` + `"ui:field": "template"` → JS expression, resolves to the returned value

## Service connectors & MCP

`serviceConnectors` let nodes share capabilities inside a workflow.

```typescript
serviceConnectors: [
  { name: "embeddingService", serviceType: "embedding",
    methods: ["createEmbedding"], isService: false }, // consumer
  { name: "mcpService", serviceType: "mcp", isService: true }, // provider
]
```

A node has **two independent channels**:
- `handleServiceCall` — MCP channel. Tool calls from an agent. Returns data to the agent. Does NOT fire the node's `outputs[]`.
- `executeNode` — workflow channel. Graph-triggered. Returns `{ __outputs }` which propagates down data edges.

Three patterns (see `08-mcp-services.md`):
- **A. Pure MCP** — `handleServiceCall` only; no `executeNode`. Agent RPC endpoint (e.g. `PostgresFetch`).
- **B. Pure workflow** — `executeNode` only; no MCP. Standard pipeline step (e.g. `S3Files`).
- **C. Hybrid** — both methods, independent channels. Tool calls return data to agent; graph triggers fire outputs. The two channels do NOT cross. Example: `SpatialSearch`.

Escape hatch: if an MCP tool call *must* also fire the workflow channel, call `executeNodeWithRouting(this.executeNode.bind(this), params, config, context)` from inside `handleServiceCall`. Rare. `MCPgetNeeds` is the canonical example.

Always implement `getSchema` so consumers can discover tools.

## Signal routing (CallbackNode only)

```typescript
inputs: [
  { name: "items",    type: NodeInputType.ARRAY,  required: true,  signal: "EXECUTE"  },
  { name: "continue", type: NodeInputType.SIGNAL, required: false, signal: "CONTINUE" },
]
```

Signal types: `EXECUTE` (default trigger), `CONTINUE` (next iteration), `SPAWN` (init actor), `RESET`. A node becomes ready when **any one** of its input connectors has all its required sources populated — `nodeInputs[target][connector][source] = output`.

## Plugin registration

```typescript
// src/index.ts
import { createPlugin, type GravityPluginAPI } from "@gravityai-dev/plugin-base";
import packageJson from "../package.json";

export default createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  async setup(api: GravityPluginAPI) {
    const { MyNodeNode } = await import("./MyNode/node");
    api.registerNode(MyNodeNode);
    const { MyCredential } = await import("./credentials");
    api.registerCredential(MyCredential);
  },
});
```

## Package Marketplace Metadata (REQUIRED)

Every package must include a rich `gravity` field in `package.json` for the marketplace. See `10-package-marketplace.md` for full schema.

**Minimum required `gravity` field:**

```json
"gravity": {
  "displayName": "My Package",
  "category": "ai",
  "logoUrl": "https://res.cloudinary.com/sonik/image/upload/v.../icon.webp",
  "nodes": [
    {
      "name": "My Node",
      "type": "PromiseNode",
      "description": "One-line description of what this node does",
      "category": "AI",
      "mcp": false
    }
  ],
  "features": [
    "Feature one",
    "Feature two",
    "Feature three"
  ],
  "credentials": [
    {
      "name": "API Key",
      "type": "myApiKey",
      "required": true,
      "description": "Where to get this credential"
    }
  ]
}
```

**Categories:** `ai` | `storage` | `ingest` | `communication` | `cloud` | `flow` | `media` | `search` | `productivity`

**Rules:**
- `displayName` — short human-friendly name (no org prefix, no "integration for Gravity")
- `features` — 3-8 short capability strings (what users can DO, not implementation details)
- `nodes[]` — object array, not string array. Each node needs `name`, `type`, `description`, `category`
- `credentials[]` — list what API keys/tokens the user needs to provide
- `logoUrl` — square icon, hosted on Cloudinary, .webp or .svg preferred

## Workflow checklist

1. Pick PromiseNode vs CallbackNode (§ Decide the node type).
2. Scaffold the package structure.
3. Write the node definition with `configSchema`, `credentials`, `serviceConnectors`, and `whenToUse` (AI selection guidance — see § Writing whenToUse). Template field syntax is universal (§ Template field modes), not per-node.
4. Implement the executor; keep it thin — delegate to the service.
5. Implement the service; fetch credentials via `api.getNodeCredentials()`.
6. Register in `src/index.ts`.
7. **Populate `gravity` field in package.json** with marketplace metadata (displayName, category, features, nodes as objects, credentials).
8. **Write a per-node integration test** in `src/MyNode/test/MyNode.test.ts` — real API, credential passed in from a gitignored `.env`, skipped without the key. See `13-testing-nodes.md`.
9. `npm run build`, then `npm test` (or a quick check via the debug resolver):
   ```bash
   curl -X POST http://localhost:4000/api/debug/execute-node \
     -H "Content-Type: application/json" \
     -d '{"nodeType":"MyNode","config":{...},"inputs":{...}}'
   ```
10. Publish.

## Common error → fix table

| Symptom | Root cause | Fix |
| --- | --- | --- |
| "is not a PromiseNode" | Wrong import / base class | Import `PromiseNode` directly; use `getPlatformDependencies()` only for `CallbackNode` |
| Startup freeze | Module-level platform call | Move platform access inside methods; use `context.api` |
| "Credentials are required" | Missing `credentials: [...]` on definition | Add credential declaration |
| "Credential not found" | Config missing `credentials.<name>` id | Populate credential id in node config |
| Node never completes | CallbackNode missing `isComplete: true` | Return `{ isComplete: true }` |
| Downstream nodes get nothing | Returned `{ __outputs, isComplete }` instead of emitting | `emit({ __outputs })` first, then `return { isComplete: true }` |
| Multiple default exports | Duplicate `export default` | Keep one default; use named exports otherwise |

## Reference packages

Study these published packages when a pattern is unclear:

- **PromiseNode:** `@gravityai-dev/aws-bedrock`, `@gravityai-dev/openai`, `@gravityai-dev/aws-s3`
- **CallbackNode:** `@gravityai-dev/ingest` (ApifyResults), `@gravityai-dev/flow` (Loop), `@gravityai-dev/openai` (OpenAIStream)
- **MCP provider:** SpatialSearch (hybrid workflow + MCP search tools), MCPgetNeeds (workflow-triggering MCP)
- **MCP consumer:** Nova

## Further reading

- `01-quick-start.md` — full templates
- `02-node-types.md` — PromiseNode vs CallbackNode deep dive
- `03-patterns.md` — DI, output wrapping, shared utils
- `04-credentials.md` — credential context + `getNodeCredentials`
- `05-troubleshooting.md` — expanded error catalog
- `06-config-schema.md` — every configSchema option with examples
- `07-service-connectors.md` — provider/consumer contract
- `08-mcp-services.md` — pure vs workflow MCP nodes, `executeNodeWithRouting`
- `09-signal-routing.md` — route table, connector dependencies, signal types
- `10-package-marketplace.md` — marketplace schema, categories, features format
- `11-agent-skills.md` — MCP `instructions` field for nodes with complex tool protocols
- `12-migrating-integrations.md` — collapsing an external `.ssi` connector bundle into a marketplace node
- `13-testing-nodes.md` — per-node integration tests (real API, gitignored `.env`, skip without key)
- `14-node-discoverability.md` — **writing meta the AI will actually pick** — how `getNodeCatalog` ranks `whenToUse`, outcome-first rule, naming the incumbent, service-node tension
