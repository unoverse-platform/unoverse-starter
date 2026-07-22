---
sidebarTitle: "3. Create Your First Node"
title: "Create Your First Node"
---

When the marketplace doesn't have the node you need, write it. A node is a small npm package: you write TypeScript, build it, and it appears in the node library in **Canvas** like any other node.

This tutorial keeps it simple: one small node, built end to end. When you need more depth, the [Nodes](../nodes/overview.md) tab of these docs covers node development in full.

| | |
| --- | --- |
| **What you'll build** | <span className="node-chip">Quote</span>, a node that fetches a famous quote from a public API |
| **Where it lives** | `apps/unoverse/nodes/quote/` |
| **What it outputs** | Two connectors: `quote` and `author` |
| **Why this API** | It needs no key, so you focus on the shape of a node, not credentials |

## Before you begin

The platform is running (`unoverse dev`). You've built the workflow from [Create Your First Agent](./02-create-your-first-agent.md); you'll extend it to test your node.

## How a node is put together

Every node splits its work across three layers:

| Layer | File | Job |
| --- | --- | --- |
| **Definition** | `node/index.ts` | What **Canvas** shows: name, connectors, the settings form, required credentials |
| **Executor** | `node/executor.ts` | Thin glue that runs when the node executes |
| **Service** | `service/index.ts` | Your business logic and external API calls |

The executor stays thin and the service does the work. That split is the habit to build now: when a node grows, it grows in the service layer.

There are two executor types. `PromiseNode` is stateless: it runs once, one input in, one output out, like a promise. `CallbackNode` is stateful: it holds state between events and emits many outputs over time, for streaming and iteration. Most nodes are stateless, and Quote is one. The [Node Types](../nodes/02-node-types.md) guide covers the choice in depth.

## Build it

<Steps>
<Step title="Scaffold the package">

Node packages live in `apps/unoverse/nodes/`. Create `quote/` there with this layout:

| Path | What it is |
| --- | --- |
| `package.json` | The package manifest, below |
| `tsconfig.json` | The build config, below |
| `src/index.ts` | Plugin registration |
| `src/Quote/node/index.ts` | The definition |
| `src/Quote/node/executor.ts` | The executor |
| `src/Quote/service/index.ts` | The service |
| `src/Quote/util/types.ts` | Shared types |

The two config files in full, so nothing is left to guess:

```json package.json
{
  "name": "@unoverse-platform/quote",
  "version": "1.0.0",
  "description": "Fetches a random famous quote",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "@unoverse-platform/plugin-base": ">=1.1.6"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

```json tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

Then install the dependencies from inside `quote/`:

```bash Install dependencies
npm install
```

</Step>
<Step title="Write the definition">

The definition is what **Canvas** renders: the connectors you wire and the settings form you fill in. Quote has no settings, so its `configSchema` is empty.

```typescript src/Quote/node/index.ts
import { NodeInputType, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import QuoteExecutor from "./executor";

const definition: EnhancedNodeDefinition = {
  type: "Quote",
  name: "Quote",
  description: "Fetches a random famous quote",
  whenToUse: "Pick when a step needs a famous quote to open or color a reply. Returns one random quote and its author each run.",
  category: "Search",
  inputs: [{ name: "input", type: NodeInputType.STRING, required: true }],
  outputs: [
    { name: "quote", type: NodeInputType.STRING },
    { name: "author", type: NodeInputType.STRING },
  ],
  configSchema: {
    type: "object",
    properties: {},
  },
  capabilities: { isTrigger: false },
};

export const QuoteNode = { definition, executor: QuoteExecutor };
```

Each entry in `outputs` becomes a connector on the node. Downstream nodes read them as `signal.quote1.quote` and `signal.quote1.author`, where `quote1` is the instance id **Canvas** assigns when you drag the node in, the convention from [Create Your First Agent](./02-create-your-first-agent.md).

<Note>
`whenToUse` decides whether the AI workflow builder can find your node at all. The catalog ranks it against the task being built, so lead with the outcome in plain words and keep it to one or two sentences. Describe what disqualifies your node as a property ("no streaming"), and never name another node. The full guide is [Node Discoverability](../nodes/14-node-discoverability.md); read it before writing this field for a real node.
</Note>

</Step>
<Step title="Write the executor">

```typescript src/Quote/node/executor.ts
import { PromiseNode, type NodeExecutionContext, type ValidationResult } from "@unoverse-platform/plugin-base";
import { getRandomQuote } from "../service";

export default class QuoteExecutor extends PromiseNode {
  constructor() {
    super("Quote");
  }

  protected async validateConfig(): Promise<ValidationResult> {
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: Record<string, never>,
    context: NodeExecutionContext
  ) {
    const result = await getRandomQuote();
    return {
      __outputs: {
        quote: result.quote,
        author: result.author,
      },
    };
  }
}
```

Two rules matter here, and they apply to every node you'll ever write:

- Implement `executeNode()`, never override `execute()`.
- Wrap what you return in `__outputs`. That wrapper is how values reach the node's output connectors; a raw return goes nowhere.

</Step>
<Step title="Write the service">

The service holds the business logic. The executor doesn't know or care that this is an HTTP call.

```typescript src/Quote/service/index.ts
import type { QuoteResult } from "../util/types";

export async function getRandomQuote(): Promise<QuoteResult> {
  const response = await fetch("https://zenquotes.io/api/random");
  if (!response.ok) {
    throw new Error(`Quote API failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    quote: data[0].q,
    author: data[0].a,
  };
}
```

The URL is hardcoded to keep the tutorial small. A real node exposes it as a `configSchema` field, so it can change without a rebuild.

```typescript src/Quote/util/types.ts
export interface QuoteResult {
  quote: string;
  author: string;
}
```

<Note>
A service that calls an authenticated API fetches its key with `api.getNodeCredentials()`, and the definition declares the credential so **Canvas** asks for it. Keys never live in node code or env files. [Credential Management](../nodes/04-credentials.md) shows the full pattern.
</Note>

</Step>
<Step title="Register it">

The package's entry point tells the platform what it contains:

```typescript src/index.ts
import { createPlugin, type GravityPluginAPI } from "@unoverse-platform/plugin-base";
import packageJson from "../package.json";

export default createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  async setup(api: GravityPluginAPI) {
    const { QuoteNode } = await import("./Quote/node");
    api.registerNode(QuoteNode);
  },
});
```

</Step>
<Step title="Build and load">

```bash Build your package
unoverse build @unoverse-platform/quote
```

The build compiles your package and restarts the platform so it loads. Confirm it registered before you go looking for it:

```bash Verify it loaded
unoverse check
```

The loaded-nodes line now includes Quote. Open **Canvas**: <span className="node-chip">Quote</span> is in the node library.

</Step>
<Step title="Test it in a workflow">

Open your workflow from [Create Your First Agent](./02-create-your-first-agent.md). Drag <span className="node-chip">Quote</span> in and connect <span className="node-chip">Input Trigger</span> to it. Step through the workflow and open Quote's **Debug** tab: `quote` and `author` carry a fresh quote from the API.

From here, try feeding it to the model: reference `signal.quote1.quote` in the OpenAI Stream prompt and your Agent can open its answer with a famous quote.

</Step>
</Steps>

## Have Claude Code build it

<div className="skill-callout">
<img className="skill-logo" src="/images/onboarding/claude-logo.png" alt="Claude" />
<div className="skill-eyebrow">Claude Code skill · ships with your repo</div>
<div className="skill-title">/unoverse-create</div>

Claude Code already knows everything on this page. Open your repo in Claude Code and describe the node you want:

> Create a node that fetches the top story from a news API.

The skill reads the node reference, scaffolds the package with its config files, writes the definition with `whenToUse`, the executor, and the service, then builds it and verifies it loaded.

Not sure everything is wired up? Type `/mcp` in Claude Code: the `unoverse-builder` server should show as connected.

</div>

Using a different AI assistant? Point it at the node reference in your repo at `docs/nodes/`. It is the same material as the [Nodes](../nodes/overview.md) tab of these docs: node types, patterns, credentials, config schemas, and marketplace metadata.

## Next steps

<Card title="Ingest content to Spatial" icon="globe" href="./04-ingest-content-to-spatial.md" horizontal>
Ground your Agent's answers in your own content.
</Card>

<Card title="Components and templates" icon="palette" href="./05-components-and-templates.md" horizontal>
Design the interfaces your Agents speak through.
</Card>
