# CLAUDE.md — Authoring Design-System Components

How to create a component under `storybook/components/<Name>/`. A component is a UI element that becomes a **workflow node**: emitted by the AI, wired on the canvas, rendered in the client.

> Templates (`storybook/templates/`) are a different thing — see the template doc there. This file is components only.

**The fastest way to get it right: clone the closest working example, then change only what differs.**
- Static-ish card-like UI → clone **`Card/`**.
- Streams content / binds rich data from upstream → clone **`AIResponse/`**.

---

## Required files

```
components/<Name>/
├── <Name>.tsx            # pure React, prop-driven
├── <Name>.module.css     # CSS module; @import "../../styles/index.css"
├── defaults.ts           # exports <Name>Defaults (Storybook demo values only)
└── <Name>.stories.tsx    # meta + stories — drives node generation
```

`<Name>` is the folder name, the file basenames, the default-export function name, and the generated node type. They must all match.

---

## Rule 1 — The component is a pure function of props

- No data fetching, no WebSocket, no MCP, no Zustand access. The platform wraps the component and feeds it props.
- **Local UI state is fine** (open/closed, hover, image-broken flag). `useState`/`useEffect` for *local* concerns are allowed (see `AIResponse`).
- Anything that must survive re-render or come from the workflow arrives **as a prop**.
- Width is `w-full` / `100%`. The container chooses width; the component fills it. No fixed widths.
- Empty states are neutral, never errors (`src=""` → placeholder, not a throw).
- **Guard every prop access — bound data arrives partial, malformed, or wrong-typed.** A prop typed `Foo[]` will at runtime be `undefined`, `""`, a JSON string, or an array with holes (e.g. a multi-series chart where one line has no data yet). Defend each access, including **nested** ones — `Array.isArray(x) ? x : []` before `.map`/`.length`, and the same for fields *inside* array items. A top-level empty-state check is **not** enough: it can pass while a single bad element still throws deeper in. Normalize once at the top, then render off the normalized value. (This is exactly how `TrendChart` crashed: `allValues` was guarded but `list.map(s => s.data.length)` was not, so a partial `series` slipped past the empty check and threw.) `BarChart` (filters its `data`) and `StatCard` (guards `sparkline`) are the pattern to copy.
- Keep it simple. If you're reaching for aspect-ratio string math, dynamic class lookups, or subscriptions, you're drifting — look at how `Card` does it.

### Reactivity is automatic

You do **not** wire anything for the component to update when inputs change. The platform re-renders the component whenever its props change. Match `Card`'s prop-reading idiom and reactivity comes for free:

```tsx
const obj: any = props.object ?? {};
// explicit empty-string check — `||` treats "" as falsy
const src = (props.src && props.src.trim()) || obj.src || obj.image || obj.imageUrl;
```

---

## Rule 2 — Control types decide whether a field binds to inputs (the one that bites)

The story's `argTypes` `control` maps to the generated `configSchema` field `type`, which decides how the editor resolves the value:

| `control` in story | Generated field | Resolution | Use it for |
| --- | --- | --- | --- |
| `"object"` | `type: "object"` + `ui:field: "template"` | **JS expression** — `return input.x` | **Any prop that receives upstream/piped data** (content, urls, arrays). This is what makes the field update from inputs. |
| `"text"` | `type: "string"` + `ui:field: "template"` | **Handlebars** → string only | Static labels / simple string composition. **Cannot take `return input.x`.** |
| `"select"` + `options` | enum | fixed list | Fixed presentation options |
| `"boolean"` | toggle | fixed | On/off the author sets |
| `"number"` / range | number / slider | fixed | Numeric option |

**The mistake to never make:** giving a field `control: "text"` (or `select`) when it needs to receive a workflow input. It will silently fail to bind — the value just won't update. If the field should update from upstream, it **must** be `control: "object"`.

Two valid ways to make a component data-driven:
1. **Bind individual fields** → those fields are `control: "object"` (e.g. `AIResponse.text`, `ImageBlock.src`).
2. **Bind one whole `object` prop** → a single catch-all `control: "object"` prop the component destructures (e.g. `Card.object`). Good as a fallback even when you also expose individual fields.

Every workflow-bindable prop also needs `workflowInput: true`.

To sanity-check: diff your generated `packages/design-system/src/<Name>/node/index.ts` against `Card`'s / `AIResponse`'s. A field that must bind should read `{ "type": "object", "ui:field": "template" }`.

---

## Rule 3 — Don't name a component after a built-in global

The component name becomes its UMD bundle's global var. Names like `Image`, `Audio`, `Option`, `Text`, `Event`, `Map`, `Set`, etc. collide with browser/JS globals — the client renders the native global instead of your component (`Failed to construct 'Image'…`). `gen:nodes` **rejects** these names with an error. Use a non-colliding name (`ImageBlock`, `MediaPlayer`, …).

---

## Story file (drives generation)

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import MyNode from "./MyNode";
import { MyNodeDefaults } from "./defaults";

const meta: Meta<typeof MyNode> = {
  title: "Components/MyNode",
  component: MyNode,
  parameters: {
    layout: "centered",
    workflowSize: { width: 750, height: 400 }, // canvas node size
    ai: {
      // REQUIRED for AI selection. Without it the node ranks poorly in the catalog.
      description: "What it renders — concrete, one line.",
      whenToUse: "When to pick this vs siblings, naming them (e.g. 'for a promo card use Card').",
    },
  },
  argTypes: {
    // bindable-from-input fields → control: "object"
    src:    { control: "object", description: "Image URL",     workflowInput: true },
    // static option fields → natural control
    object: { control: "object", description: "Full object fallback", workflowInput: true },
    // Focus Mode (focusable/focusLabel) is auto-injected — do NOT declare it.
  },
};
export default meta;
type Story = StoryObj<typeof MyNode>;

export const Default: Story = { args: MyNodeDefaults };
```

`parameters.ai` rules: `description` = what it renders (concrete); `whenToUse` = when to pick it **versus named siblings**, 1–2 sentences. `gen:nodes` warns (doesn't fail) if `whenToUse` is missing — treat the warning as a TODO.

---

## defaults.ts

```ts
// Storybook demo values only. Never hard-code defaults inside the component.
export const MyNodeDefaults = {
  src: "https://…",
  alt: "…",
};
```

**Gotcha:** do **not** use `as const` on default values. The generator's AST parser doesn't unwrap `as` expressions, so `fit: "cover" as const` is dropped from the generated `configSchema` defaults. Use plain literals: `fit: "cover"`.

---

## CSS

- CSS modules only. `@import "../../styles/index.css"` for tokens.
- Use design tokens: `var(--spacing-3)`, `var(--color-text-secondary)`, `var(--radius-lg)`, `var(--shadow-md)`.
- No Tailwind `@apply` inside `.module.css`.
- Rendered inside a **shadow root** on the client — global selectors (`body`, `:root`) and inline `<style>` won't reach in/out.

---

## After editing

```bash
cd apps/design-system
npm run gen:nodes        # regenerates packages/design-system/src/<Name>/ — must pass
```

Then restart the dev server so node-service reloads node definitions. **Never edit `packages/design-system/src/` by hand** — it's regenerated from here.

If you renamed or deleted a component, also remove its stale generated artifacts (`packages/design-system/src/<Old>/`, `components/<Old>.js`, `dist/...`) and remove any orphaned node still placed on a saved canvas (it will 404 fetching the old bundle).

---

## Checklist

- [ ] `<Name>.tsx` — pure, prop-driven, `w-full`, neutral empty state
- [ ] `<Name>.module.css` — CSS module, imports shared styles, tokens
- [ ] `defaults.ts` — exports `<Name>Defaults`, no `as const`
- [ ] `<Name>.stories.tsx` — `workflowSize`; every input-bindable prop is `control: "object"` + `workflowInput: true`; static options use natural controls
- [ ] `parameters.ai = { description, whenToUse }`
- [ ] Name doesn't collide with a DOM/JS global
- [ ] `npm run gen:nodes` passes; bindable fields read `{ "type": "object", "ui:field": "template" }`
- [ ] Dev server restarted; node appears; binding `return input.<field>` updates it live
```
