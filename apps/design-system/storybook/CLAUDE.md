# CLAUDE.md — Design System Components & Templates

Authoring guide for anything under `apps/design-system/storybook/`. Read this before adding or editing a component or template.

Two kinds of things live here:

- **Components** (`storybook/components/<Name>/`) — UI elements that become **workflow nodes**. Emitted by AI, wired on the canvas, rendered in the client.
- **Templates** (`storybook/templates/<Name>/`) — layout containers that receive conversation history and decide how to render it. Not workflow nodes, not sent by AI.

The build chain (`npm run gen:nodes` from `apps/design-system/`) scans this tree, extracts metadata from stories, bundles the React source with Vite, and writes generated files into `packages/design-system/src/<Name>/`. **Never edit files under `packages/design-system/src/` by hand** — they are regenerated from here.

---

## Components (workflow nodes)

### Required files

```
components/<Name>/
├── <Name>.tsx               # pure React, prop-driven, no hooks beyond local UI state
├── <Name>.module.css        # CSS modules; @import "../../styles/index.css"
├── <Name>.stories.tsx       # meta + stories; drives node generation
└── defaults.ts              # exports <Name>Defaults (and any extras for Storybook)
```

### The one mistake to never make

**Workflow-bindable props must use `control: "object"` in the story's `argTypes`**, not `control: "text"`, not `control: "select"`.

Why: the generator maps the storybook `control` to the node's `configSchema` field `type`. The platform resolves `ui:field: "template"` differently based on `type`:

| Field type | Template semantics | Editor input |
| --- | --- | --- |
| `type: "object"` + `ui:field: "template"` | **JS expression** — `return <anything>` | Evaluates against `input`, pulls piped values |
| `type: "string"` + `ui:field: "template"` | Handlebars — resolves to a string | Only useful for composing strings |
| anything else | Static value | No templating |

If the field needs to receive upstream workflow inputs, it has to be `type: "object"`. `control: "object"` in the story produces exactly that.

**Example — correct:**

```ts
// components/MyNode/MyNode.stories.tsx
argTypes: {
  title:    { control: "object", description: "Title",           workflowInput: true },
  markdown: { control: "object", description: "Markdown content", workflowInput: true },
  mode:     { control: "object", description: "Display mode",     workflowInput: true },
},
```

**Example — wrong (was the MarkdownRenderer bug):**

```ts
// ❌ Generates type:"string" → handlebars only → can't bind to input.markdown
markdown: { control: "text", ... }
// ❌ Generates an enum → fixed options, can't template
mode:     { control: "select", options: [...], ... }
```

If in doubt, diff your `configSchema` in the generated `packages/design-system/src/<Name>/node/index.ts` against `AIResponse`'s. Workflow-bindable fields should read exactly:

```json
{ "type": "object", "title": "...", "ui:field": "template" }
```

### Story file template

```ts
import type { Meta, StoryObj } from "@storybook/react";
import MyNode from "./MyNode";
import { MyNodeDefaults } from "./defaults";

const meta: Meta<typeof MyNode> = {
  title: "Components/MyNode",
  component: MyNode,
  parameters: {
    layout: "padded",
    workflowSize: { width: 750, height: 400 }, // canvas size
    // AI selection guidance — REQUIRED. See "AI selection guidance" below.
    ai: {
      description: "One line: what this component renders (be concrete).",
      whenToUse: "When to pick this vs. sibling components — name the alternatives.",
    },
  },
  argTypes: {
    // Every prop that should be bindable from the workflow
    myProp: { control: "object", description: "...", workflowInput: true },
    // Focus Mode is opt-in; the generator auto-injects focusable/focusLabel
    // into the node's configSchema — you do NOT need to declare them in argTypes.
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: MyNodeDefaults };
```

`workflowSize` drives `nodeSize` on the canvas. `workflowInput: true` marks the prop as workflow-bindable. The generator uses these.

### AI selection guidance (`parameters.ai`)

The AI workflow-builder chooses *which* display component to emit. It does this through the Unoverse MCP node catalog, which **embeds each node's `description` + `whenToUse`** and ranks by similarity to the step's task. A component with no guidance falls back to a generated boilerplate description (`"<Name> UI component from design system"`) — making every display component look identical to the ranker, so the right one rarely surfaces.

Author a `parameters.ai` block in the story `meta`. The generator (`ComponentScanner` → `NodeIndexGenerator`) writes `description` and `whenToUse` into the generated node definition; `CatalogService` consumes them automatically (no other wiring).

```ts
parameters: {
  workflowSize: { width: 750, height: 400 },
  ai: {
    // What it renders — concrete, one line. Replaces the boilerplate description.
    description: "Streaming conversational AI answer: markdown body, thinking dots, follow-up chips.",
    // When to pick this vs. siblings — name the alternatives by component name.
    whenToUse: "Default for chat-style streamed replies. For a static document use MarkdownRenderer; for a booking confirmation use BookingWidget.",
  },
},
```

**Rules** (mirror code nodes' `whenToUse`):

1. `whenToUse` is selection guidance, not a restated description — say when to pick this **versus its siblings**, naming the alternatives (e.g. "for X use MarkdownRenderer").
2. 1–2 sentences, under ~250 chars.
3. `description` states what the component renders, concretely (data + key affordances), not marketing.
4. `gen:nodes` **warns** for any component missing `parameters.ai.whenToUse` — treat the warning as a TODO, it does not fail the build.

### Component source rules

- **Pure function of props.** No `useEffect` that fetches, no WebSocket, no MCP, no Zustand access. The platform wraps your component with `withZustandData` automatically.
- **Local UI state only** (open/closed, hover, input buffers). Anything that must survive re-render comes in via props.
- **No imports from `packages/`.** Storybook is the source of truth.
- **Width is `w-full`** or similar responsive sizing. Templates choose the container width; components fill it. Fixed widths break layouts.
- **Empty states must be neutral**, not errors. `markdown=""` → placeholder, not a thrown error.
- **External links:** always `target="_blank" rel="noopener noreferrer"` (see the `ExternalLink` override pattern in `AIResponse.tsx`).

### Defaults file

```ts
// defaults.ts — ONLY used for Storybook previews and by templates' mock clients
export const MyNodeDefaults = {
  myProp: "demo value",
};
```

Never hard-code defaults in the component itself. Production always receives real props.

### After editing a component

```bash
cd apps/design-system
npm run gen:nodes        # regenerates packages/design-system/src/<Name>/
```

Then verify the generated `configSchema` matches expectations and restart the dev server so node-service reloads definitions.

---

## Templates (layout containers)

Templates interpret conversation history and arrange components into a layout. They are **not** workflow nodes — the AI never emits a template, the workflow metadata selects one.

The authoritative template guide is **[`templates/README.md`](./templates/README.md)** — read it for lifecycle, `GravityClient` API, focus mode, multi-template journeys, and the 3-state Storybook pattern.

### What you must get right

- **`{ client }` is the only prop you rely on.** `client.history.entries`, `client.sendMessage`, `client.emitAction`, `client.session`. Don't read Zustand directly.
- **Components arrive pre-wrapped.** Use `renderComponent(c)` from `../core` — it already knows how to merge Zustand data. Never import a component from `packages/design-system/` inside a template at runtime.
- **Storybook stories follow the 3-state pattern:** `Initial`, `Streaming`, `Complete`. Use `createMockClients` from `../core` and pull prop defaults from each component's `defaults.ts` (no duplication).
- **Full-height decorator is required:**
  ```tsx
  decorators: [(Story) => <div style={{ height: "100vh", width: "100vw" }}><Story /></div>],
  parameters: { layout: "fullscreen" },
  ```
- **Templates don't manage component data.** If you find yourself wiring subscriptions or tracking streaming state per component, you're fighting the architecture — step back and let `renderComponent` and Zustand do their work.

### Template switching

Workflows choose a template via `metadata.template` + `metadata.templateMode` (`switch` | `stack` | `replace`). Templates must handle arbitrary history (including components they've never seen) gracefully.

---

## Shared rules for both

- **CSS modules only.** `@import "../../styles/index.css"` for design tokens. No Tailwind `@apply` rules inside `.module.css`. Use CSS variables (`var(--spacing-3)`, `var(--color-text-primary)`).
- **Shadow DOM boundary.** Anything rendered is inside a shadow root on the client. Styles don't leak out; inline `<style>` tags don't leak in. Global selectors (`body`, `:root`) won't do what you want.
- **Don't touch `packages/design-system/src/`.** If you need to change generated output, change the storybook source or the generator (`scripts/generate-nodes.ts`) and regenerate.
- **`npm run gen:nodes` must pass** before committing. The generator validates that every component has a story and that every story has a default export and at least one named story.
- **Names are contracts.** A prop named `markdown` becomes a config field named `markdown`. Renaming breaks existing workflows — treat it like an API change.

---

## Quick checklist

New component:

- [ ] `components/<Name>/<Name>.tsx` — pure, prop-driven, `w-full`
- [ ] `<Name>.module.css` — CSS module, imports shared styles
- [ ] `defaults.ts` — exports `<Name>Defaults`
- [ ] `<Name>.stories.tsx` — meta with `workflowSize`, every workflow-bindable prop uses `control: "object"` + `workflowInput: true`
- [ ] `<Name>.stories.tsx` — meta with `parameters.ai = { description, whenToUse }` (AI selection guidance — see § AI selection guidance)
- [ ] `npm run gen:nodes` succeeds (no `parameters.ai.whenToUse` warning for this component)
- [ ] Generated `configSchema` for bindable props reads `{ "type": "object", "ui:field": "template" }`
- [ ] Dev server restarted; node visible in editor; can bind `return input.<field>` from an upstream node

New template:

- [ ] `templates/<Name>/<Name>.tsx` — renders `client.history.entries` via `renderComponent`
- [ ] `types.ts` extends `GravityTemplateProps`
- [ ] `defaults.tsx` — uses `createMockClients`, pulls from component defaults
- [ ] `<Name>.stories.tsx` — 3 stories (`Initial`, `Streaming`, `Complete`), full-height decorator, `layout: "fullscreen"`
- [ ] `npm run gen:nodes` succeeds (templates are bundled the same way)

---

## Further reading

- [`templates/README.md`](./templates/README.md) — authoritative templates guide (lifecycle, client API, focus mode, architecture)
- [`components/BookingWidget/README.md`](./components/BookingWidget/README.md) — worked example of a rich stateful component
- `scripts/generate-nodes.ts` — generator source; the ground truth for what fields storybook controls produce
- `docs/markdown-editor-spec.md` — reference for composing a pure-service node (SmartDocument) with a dumb renderer component (MarkdownRenderer)
