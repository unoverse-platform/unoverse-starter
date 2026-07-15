# 05 — Templates (MCP Apps)

**A template is a whole surface and a deployable MCP App. Its manifest IS its envelope; its surfaces are reactions to component state.**

Components render pieces; a **template** is the shell around them — the chat layout, the voice surface. It owns **nothing**: conversation and component data live in the store, so templates are swappable mid-conversation.

---

## 📁 The anatomy — manifest-only

```
rx/orgs/<org>/templates/bppchatlayout/
├── manifest.json        # THE ENVELOPE — everything about the app (below)
├── layouts/
│   └── main.json        # the root tree (named by manifest.layout, default "main")
├── components/          # template-local partials (header, composer-bar, turns, …)
└── states/              # the template's layers (welcome, conversation, focus)
```

There is **no `<name>.json`** — the manifest is the single contract file and `layouts/main.json` is the root. Same folder grammar as components: `layouts/` (the surface), `components/` (local partials), `states/` (layers).

```jsonc
// manifest.json — the whole app in one file
{
  "name": "BPP Assistant",
  "description": "The BPP learning-support chat for questions about studying with BPP.",
  "whenToUse": "Ask BPP a question or get general guidance about studying…",   // utterance-shaped — selection text
  "category": "Assistant",
  "version": "1.0.0",
  "defaultState": "template",                     // the app's load state: "template" = the full surface
  "width": "70vw",
  "inputSchema": { "type": "object", "properties": { "message": { "type": "string" } } },
  "stateOrder": ["welcome", "conversation", "focus"],   // the states/ files, in picker order
  "binding": { "workflow": "wf-8koixv", "trigger": "inputtrigger1" },   // the app OWNS its workflow
  "autoTrigger": false,
  "layout": "main"
  // a voice template adds: "service": "voice"  (the channel instantiates the native service)
}
```

This is the MCP-apps standard in practice ([02](./02-sdui-and-mcp-apps.md)): clients pull the app as MCP resources; sends are `tools/call` on its trigger tool; a wizard's answers are a native elicitation. The channel never invents transport.

---

## 🧩 Template-only primitives

- **`Timeline`** — renders the conversation (you supply the `user`/`assistant` turn subtrees; per-turn scope carries `text`, `streaming`, …). The conversation bucket is locked to the stream ([04](./04-state.md)).
- **`ComponentSlot`** — where components render. Two forms:

```jsonc
// 1. the FLOW slot — components render inline in the conversation (the default home)
{ "type": "ComponentSlot", "select": {} }

// 2. a REACTION surface — presents whichever component is in a named state (§04)
{ "type": "ComponentSlot",
  "select": { "from": "all", "where": { "field": "defaultState", "eq": "focused" }, "limit": 1 },
  "frame": { /* the surface chrome the selected component renders inside */ } }
```

Rules that bite:
- ✅ Reaction surfaces select by the **view** (`where { field: "defaultState" }`) — ❌ never by component type (`type: ["SomeWidget"]`), ❌ never by a component's internal state key (that's private). Both are lint-flagged violations.
- ✅ **One instance → one placeholder.** While a component's view matches a surface, it renders **there** — it *lifts out of the flow* into the surface; the SDK keeps it out of the flow so it never paints twice. Its own ✕ switches it back to `inline` and it returns to the flow. You never hide a flow copy yourself.
- ❌ Never size or restyle a component from the template — a component owns its faces ([03](./03-components.md)); the template owns only the **framing** (and how a placeholder lays out multiple instances, via `select`).

---

## 🔍 Surfaces per state — the template decides what names mean

A template defines a surface for each state name it recognizes; unknown names render inline (the universal default). The chat layout's focus state is just:

```jsonc
// states/focus.json — reacts to ANY component that sets defaultState: "focused"
{ "type": "ComponentSlot",
  "select": { "from": "all", "where": { "field": "defaultState", "eq": "focused" }, "limit": 1 },
  "frame": { "type": "Box", "style": { "position": "absolute", "inset": "0", "background": "surface.base" },
             "children": [ { "type": "ComponentSlot" } ] } }
```

Same mechanics for a custom state: a template that wants to frame course cards adds a surface with `where: { "field": "defaultState", "eq": "course" }` — zero SDK or protocol change. Different templates present the same view completely differently (a full **overlay**, a **right-hand panel** beside the flow, a modal, a rail) — the surface *is* the frame, and it lives in the template, never the SDK. Both a covering overlay and a side panel work equally: the instance has already lifted out of the flow (one placeholder), so a side-by-side surface does **not** double-render — you don't need an overlay to hide a flow copy.

**Rich layers cap their height and scroll inside** (header/footer pinned, `flex: 1` + `minHeight: 0` + `overflow: auto` body) — a focus surface holds unbounded content.

---

## 🎙️ Voice templates

Declare `"service": "voice"` in the manifest; the channel instantiates the native service, which projects **`callState`** into scope. The template branches its phase layers on it (`states/idle … states/user-speaking`), and its focus panel is a normal reaction surface. Audio is never wired in a definition.

---

## 🤖 `whenToUse` — how the AI picks the app

The manifest's `whenToUse` is the selection text findIntent ranks against the user's own message:

| | Example |
|---|---|
| ✅ Utterance-shaped, outcome-first | "Book, change or cancel a trip." |
| ❌ Selector-shaped | "Use this when the user wants to book." |
| ✅ Disqualify by property | "Not for data-dense monitoring." |
| ❌ Disqualify by naming a sibling | "Don't use if AcmeDashboard exists." |

A fallback/home surface cedes specific jobs *by property*, never by enumerating its siblings' vocabularies (the generalist trap).

---

## 📋 Template checklist

- [ ] Manifest-only: no `<name>.json`; `manifest.layout` → `layouts/main.json`
- [ ] `binding.workflow` + `binding.trigger` real (the app owns them); `stateOrder` = the `states/` files
- [ ] Flow slot generic (`select: {}`); reaction surfaces select by `where`, never `type`
- [ ] Surfaces defined for every state name the app should react to; everything else falls back inline
- [ ] `whenToUse` utterance-shaped; `description` ≤120 chars
- [ ] `./unoverse lint` 0 errors, then preview in Studio — mock states, then live ([07](./07-studio.md))

---

**Next:** [06 — Styles & Tokens](./06-styles-and-tokens.md).
