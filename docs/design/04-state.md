# 04 — State (the reaction contract)

**Components write themselves. Templates react. Inline is the universal default.**

Think Redux: ONE store; a component dispatches only to **its own slice**; templates are **pure views with selectors** over that store. Every write goes one direction. This is the most important doc in the pack — every interactive behavior is built from it.

---

## 🪣 The three buckets

| Bucket | Holds | Written by |
|---|---|---|
| **Conversation** | the timeline of turns, each turn's status (streaming/complete), the voice transcript | 🔒 **the stream** (and the voice service) — never by you |
| **Component state** | one slice per component: its streamed data **and** its own view state (`defaultState`, `step`, …) | streamed `COMPONENT_DATA` + the component's own `setValue` actions |
| **Template state** | the template's **own** things only: its `draft`, its panels (`openPanel`) | the workflow (`TEMPLATE_DATA`) + `setTemplateValue` — never a component |

All three live in the client's in-memory store, rebuilt from the stream on reload. They are render state; the agent's conversation memory lives on the server — a different layer.

---

## ⚡ The reaction contract

**A component's state changes exactly two ways — both the same write into its own slice:**

1. **Arrival** — it streams in already in a state (the manifest's `defaultState`, [03](./03-components.md)).
2. **Interaction** — the user clicks it into a state: `setValue { defaultState: "focused" }` — now, or ten turns later.

**Templates react via selectors — never by component type, never by id:**

```jsonc
{ "type": "ComponentSlot",
  "select": { "from": "all", "where": { "field": "defaultState", "eq": "focused" }, "limit": 1 } }
```

- A component enters a state the template has a surface for → the surface presents it.
- A state the template doesn't know → **nothing happens; the component stays inline.** No error, no registry of valid state names.
- "Which component?" is intrinsic — the one that changed state is the one selected. Conflicts: most recent wins (`limit: 1`).
- **One instance → one placeholder.** A component instance renders in exactly one place. While its **view** matches a surface, it renders **there** — it *lifts out of the flow into the surface*; with no matching surface it renders in the **flow** (the `inline` placeholder). It never paints in two places at once — you never hide a flow copy yourself (no `hideBelow`, no overlay-to-cover; the SDK keeps a claimed instance out of the flow). Its data stays in the conversation history throughout. **Close = the instance switches its view back** (its expanded face carries its own ✕ → `setValue { defaultState: "inline" }`) → the surface releases it → it's back in the flow.
- **State is local; the view is the interface.** A component's *internal* state (`step`, `phase`, …) is private — the template never reads it. The only thing that crosses to the template is the **active view** (`defaultState`); the template reacts to *that* (`select.where { defaultState }`), never to a component's internal keys.
- **Many instances are fine.** A source can create many instances of a component (three courses → three cards); the rule is *per instance*. **The template decides how a placeholder lays its instances out** — a flow list, one focus (`limit: 1`), a rail/grid — via its `select`.
- **Template-focus is derived, not stored**: "is anything focused?" = "does any component match my focus selector?". Nothing writes a focus flag anywhere.

**The two global rules — the only protocol-level behavior:**

1. **`template` swaps the shell** (the one reserved name) — the whole surface re-renders; conversation, components, and data stay in the store, and the new template reacts through *its own* selectors.
2. **Inline is the universal default.** No state, or a state no selector matches → the component renders inline in the flow. Always.

### State names are open — the template decides what they mean

`focused` isn't hardcoded anywhere. A component can arrive in **any** named state — `focused`, `course`, `pip` — and a template reacts to exactly the names it defines surfaces for: a `where: { eq: "course" }` rail frames course cards; a template without one renders them inline. New names ship with zero protocol change. (Convention: keep names consistent per org — `focused` in one component and `focus` in another silently fragments the vocabulary templates select on.)

---

## ✍️ The two writes

- **`setValue`** → the component's **own slice** — its answers, its `step`, its `defaultState`. This is the only thing a component ever writes.
- **`setTemplateValue`** → template state — **only for what is genuinely the template's own** (a disclosure panel, the composer draft). ❌ A component chaining `setTemplateValue` to open a surface is the deprecated bridge — the linter flags it; use a `where` selector instead.

```jsonc
// a wizard option: record the answer + advance — one setValue, own slice
{ "action": { "type": "setValue", "values": [
    { "key": "subject", "value": "{{value}}" },
    { "key": "step", "value": "route" }
  ] } }
```

Anything that is not one of these two routes to the **server as a native MCP call** ([02](./02-sdui-and-mcp-apps.md)): sending a message is `tools/call`; answering a waiting wizard is an elicitation. You never build transport.

---

## 🎬 The four moves — one condition vocabulary

All reactivity is `eq` / `ne` / `in` / truthy applied four ways:

| Move | Use when | Example |
|---|---|---|
| **`visibleWhen`** | a small thing appears/disappears | `{ "field": "isLookingUp", "eq": true }` |
| **`Switch`** | a whole view swaps (faces, wizard steps) | `"on": "defaultState", "cases": { … }` |
| **`Each`** | repeat — a literal `items: []` list or a bound array | see [03](./03-components.md) |
| **`style.when`** | the same element restyles by state | `[{ "field": "deltaPositive", "eq": true, "apply": { "color": "status.success" } }]` |

✅ Mutually exclusive views belong in **one `Switch`**; a case never re-guards its own discriminant. Name **one field per axis** (`defaultState`, `step`, `callState`) — never boolean soup.

### Named states are first-class — enumerated, viewable, served

Each layer lives as a file (`states/`, faces in `layouts/`), so three consumers read them automatically: **Studio** shows a pill per state (+ the Inline/Focused master toggle), the **served manifest** lists them for any MCP caller, and **`stateOrder`** fixes the order. Add a state = add a file.

---

## 🔒 Locked state — managed FOR you, read-only to you

1. **Conversation & lifecycle** — written only by the stream. "Is it thinking" is the derived `isStreaming`/`isEmpty` flags; project them, never simulate them (a stuck flag is a stream-delivery bug to report, not to patch in a definition).
2. **Voice** — the SDK's voice service owns the audio natively and, as a producer, projects **`callState`** (`idle · active · agentSpeaking · userSpeaking`) into the template's scope; a voice template branches its phases on that one field. The transcript rides the conversation. A template binds the service by declaring `service: "voice"` in its manifest. You never wire audio.
3. **Native host chrome** — ephemeral toggles that belong to the embedding host live in the host's own state, passed as `props`; never in the store, never a new primitive.

### The decision table

| The state is… | It goes in… | Written by |
|---|---|---|
| a component's data, answers, or view state (incl. `defaultState`) | the component's own slice | stream + its own `setValue` |
| the template's own chrome (panels, draft) | template state | `setTemplateValue` |
| "is a component focused/expanded" | **nowhere — derived** via a `where` selector | — |
| conversation flow / streaming status | 🔒 conversation (derived flags) | the stream only |
| voice call phase / transcript | 🔒 projected by the voice service | the service (you read it) |
| host-screen-only chrome | 🔒 the native host, as `props` | the channel |

---

**Next:** [05 — Templates (MCP Apps)](./05-templates.md).
