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
    category: "AI", // AI | Flow | Output | Storage | Ingest
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

- **Pure MCP service** — implement `handleServiceCall(method, params)` that returns data directly; no workflow routing.
- **MCP workflow node** — calls `executeNodeWithRouting(this.executeNode.bind(this), params, config, context)` so downstream nodes trigger via `NODE_OUTPUT`; returns a short summary to the MCP caller.
- Always implement `getSchema` so consumers (e.g. Nova) can discover tools.

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

## Workflow checklist

1. Pick PromiseNode vs CallbackNode (§ Decide the node type).
2. Scaffold the package structure.
3. Write the node definition with `configSchema`, `credentials`, `serviceConnectors`.
4. Implement the executor; keep it thin — delegate to the service.
5. Implement the service; fetch credentials via `api.getNodeCredentials()`.
6. Register in `src/index.ts`.
7. `npm run build`, then test via the debug resolver:
   ```bash
   curl -X POST http://localhost:4000/api/debug/execute-node \
     -H "Content-Type: application/json" \
     -d '{"nodeType":"MyNode","config":{...},"inputs":{...}}'
   ```
8. Publish.

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
- **MCP provider:** PostgresFetch (vector search), MCPgetNeeds (workflow-triggering MCP)
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
