# Unoverse — Authoring Components & Templates (the complete guide)

> **Status**: 🟢 Guide (June 2026) — the single source of truth for *writing definitions*.
> **Audience**: anyone creating or reviewing `apps/unoverse/rx/**` definitions.
> **Companions**: [`UNOVERSE_STATE_MODEL.md`](./UNOVERSE_STATE_MODEL.md) (where state lives),
> [`UNOVERSE_LAYERS.md`](./UNOVERSE_LAYERS.md) (how state organizes UI — `layouts/` + `states/` + `components/`),
> [`UNOVERSE_CONFORMANCE.md`](./UNOVERSE_CONFORMANCE.md) (how these rules are **enforced** — the
> editor JSON Schema + guard tests), [`UNOVERSE_SPEC.md`](./UNOVERSE_SPEC.md) (rendering), and the
> SDK's `FRAMEWORK.md` (the laws the engine obeys).
>
> **One line:** a definition is **React without the framework** — state is data, the renderer
> redraws on every change, and a tiny control-flow vocab decides what shows. You build **any**
> UI in `rx/` data and **never edit the SDK**.
>
> **Use this doc two ways:** read §1–§8 to *build*; run §9 (the **conformance checklist**) to
> *audit* an existing component or template.

---

## 1. The mental model — design like React

You are writing a **declarative view that reacts to state**, exactly like a React component —
the vocabulary is JSON instead of JSX, and there is **no state machine, no transitions, no
lifecycle** to manage. The renderer is stateless: it throws the tree away and rebuilds it from
the current data on every change. You describe *what the UI looks like for a given state* —
never *how to move between states* (that's just `setValue` writing a field, then a redraw).

| React | Unoverse definition |
|---|---|
| `useState` | a field in the component's data slice (`step`, `defaultState`) |
| `setState(...)` | `action: { "type": "setValue", "values": [...] }` |
| re-render on change | the store notifies → the renderer **redraws the whole tree** |
| `{cond && <X/>}` | **`visibleWhen`** |
| `switch (x) { case … }` | the **`Switch`** node (`on` + `cases`) |
| `items.map(...)` | **`Each`** (`template` + literal `items: []`, or `bind.items` for workflow-fed lists) |
| `<Button/>` (a shared component) | a **`Ref`** to an atom |
| extracting `<StepX/>` to a file | `{ "$include": "step-x" }` |
| a conditional `className` | **`style.when`** |

---

## 2. Anatomy of a definition

Every component, template, and atom is one JSON file with the same envelope:

```jsonc
{
  "unoverse": "1.0",
  "kind": "component",          // "component" | "template" | "atom"
  "name": "Card",               // display name (independent of the filename)
  "category": "Content",        // grouping in the palette
  "description": "…",           // what it is
  "whenToUse": "…",             // selection text — lives in manifest.json when discoverable (envelope form only for flat, manifest-less components)
  "props": { /* see §3 */ },
  "root": { /* the primitive tree — the UI */ }
}
```

- **`root`** is a tree of nodes. Every node has a `type` from the **closed set** (§8) plus
  `style`, `bind`, `children`, `visibleWhen`, `action`, etc.
- **`name`** is independent of the filename; lookup is **case-insensitive by filename**.
- **File placement** (the filesystem *is* the registry — no index to update):

  | Kind | Lives in | Form |
  |---|---|---|
  | component | `rx/components/<name>/<name>.json` + optional `manifest.json` (render contract + discovery) + `layouts/` (faces, filename = state name) + `states/` + `components/` | flat `rx/components/<name>.json` for a simple one-face card |
  | template | `rx/orgs/<org>/templates/<name>/` — **manifest-only**: `manifest.json` IS the envelope; root = `layouts/<manifest.layout>.json` (+ `states/`, `components/`) | org-scoped; no `<name>.json` |
  | atom | `rx/atoms/<name>.json` | shared partials, never served standalone |

---

## 3. Props & `bind` — the data contract

> **The discipline (July 2026): components are CONTAINED MICROAPPS.** A component is a
> light, self-contained app. Everything it shows has exactly ONE of three homes —
> anything else is **slop**:
>
> 1. **Hardcoded content** — copy, titles, option lists, images are LITERALS in the
>    layout (`value` on Text, `items` on Each, `src`/`alt` on Image). Never props,
>    **never the `state` block.**
> 2. **`state` block — SCALAR internal view-state ONLY** — the mutable keys the
>    component's own actions write (`step`, `phase`, `progressPct`, `questionLabel`),
>    with their initial values. It is **NOT a content home**: an **array** (a finder's
>    `courses`), an **object**, a **URL** (`heroImage`), or any **workflow-fed data**
>    sitting in `state` is slop — move it out (→ #1 or #3). Merged into the render scope
>    beneath the live slice.
> 3. **`props` (`input: true`)** — the EXTERNAL contract: the workflow-fed data a run
>    streams in (a finder's matched `courses`, the user's real accounts), each with a
>    mock `default` for preview. A component with no workflow feed has an empty/absent
>    props block.
>
> The **arrival `defaultState` is NOT in the `state` block** — it's the render contract,
> declared in the component **manifest** (an open name, default `"inline"`; §3a).
>
> The audit is mechanical: static content → hardcode in the layout; a **scalar** the
> component mutates → `state`; data the workflow feeds → `props` (`input: true`); the
> arrival face → the **manifest**. **An array / object / URL in `state` is the tell for
> #1 or #3 slop.** (CardFinder went from ~60 props to ZERO props + a lean scalar `state`.)

`props` declares every field the UI reads, with a `type` and a **`default`** (the mock value
the workbench renders):

```jsonc
"props": {
  "accounts": { "type": "array", "input": true, "default": [ /* mock rows for preview */ ] }
}
```

- **Every prop is `input: true`** — the external workflow feed, nothing else. Static content is
  hardcoded in the layout; view-state initials live in the `state` block; the arrival
  `defaultState` lives in the manifest. (A *flat, manifest-less* card streamed with simple
  fields may still declare them as `input: true` props — its whole surface IS the feed.)
- **`default`** is the mock value Studio renders — realistic content, not empty strings.

A node reads a prop with **`bind`** (`targetProp → dataField`):

```jsonc
{ "type": "Text",   "bind": { "value": "title" } }
{ "type": "Image",  "bind": { "src": "image", "alt": "title" } }
{ "type": "Button", "bind": { "label": "callToAction" } }
{ "type": "Each",   "bind": { "items": "accounts" }, "template": { /* per-row */ } }
{ "type": "Icon",   "bind": { "name": "iconField" } }   // or literal "icon": "expand"
```

---

## 3a. Spatial discovery — the OPTIONAL component `manifest.json`

A basic component needs **no manifest** — a workflow **streams** it in (path **D**),
it renders, it's done. Add a `manifest.json` to the component folder **only when the
component should be discoverable in Spatial** (indexed into the 3D knowledge map,
ranked against user intent by findIntent). The manifest's **presence IS the
capability** — there is no flag inside it, and nothing else grants it.

> **What "discoverable" means, precisely (native MCP — see `UNOVERSE_MCP_TEMPLATE_PROTOCOL.md`
> §0.1 paths B/C).** A discoverable component is published as a standard **MCP app**: it
> registers a tool whose `_meta.ui.resourceUri` is a `ui://` shell that renders this
> component. When findIntent surfaces it, the LLM does an ordinary `tools/call`, the result
> carries the UI, and **the SDK renders the card into the chat** — *no workflow, no
> `COMPONENT_INIT` emit, no "the LLM renders a component."* This is **additive to** streaming,
> not a replacement: a self-contained component (path **B**) carries its own data in its
> `state` block; a **node-hydrated** card (path **C**) is a shell a spatial data node fills.
> A component being *streamed by a workflow* (path **D**, e.g. AIResponse) is unchanged and
> remains the standard runtime paint path. The manifest here is what turns a plain component
> into a path-B app; a path-C card is a normal component whose data arrives from a node.

The manifest carries only discovery meta:

```jsonc
// rx/components/cardfinder/manifest.json
{
  "title": "Card Finder",                       // display name (falls back to the def name)
  "description": "A guided card-finder quiz: a few eligibility and preference questions ending in a best-fit card recommendation.",
  "whenToUse": "Find the right card for me — which card should I get, what card is best for travel or rewards, am I eligible? A few quick questions end in one personalised best-fit recommendation with the reasons why it fits.",
  "category": "Input",
  "version": "1.0.0"
}
```

- **`description`** — what it IS: the listing subtitle, **one short line (≤120 chars,
  guard-enforced)**. No "use when…" inside it — detail belongs in `whenToUse`.
- **`whenToUse`** — the **selection text** findIntent ranks against the user's OWN
  message, so write it **utterance-shaped** — the words the user would actually say
  ("Find the right card for me — which card should I get…") — never selector-shaped
  dev framing ("Pick when the user asks to…", guard-rejected). When present it
  replaces `description` in the embedded text. Full contract:
  `docs-starter/nodes/14-node-discoverability.md` (the templates/skills section
  applies to components verbatim).
- The manifest is the **single home** for this meta — the envelope must not
  duplicate `description`/`whenToUse` (guard-enforced). The server merges the
  manifest over the def, so every consumer reads one shape.
- Exposure is **two toggles, both off by default**: the manifest makes the Studio
  "Spatial" toggle appear on the component (Level 1 — workbench eligibility); the
  Content Engine then opts it onto a specific workflow's map (Level 2 — presence),
  where it's indexed and trained like any skill or template.

---

## 4. Your first component (walkthrough)

A focusable card that expands inline → focused. File: `rx/components/mywidget/mywidget.json`.

```jsonc
{
  "unoverse": "1.0",
  "kind": "component",
  "name": "MyWidget",
  "category": "Content",
  "description": "A card that expands from a compact row to a focused panel.",
  "whenToUse": "Show a single item that can expand in place to reveal detail.",
  "props": {
    "title":        { "type": "string", "default": "My widget" },
    "detail":       { "type": "string", "default": "The expanded detail goes here." },
    "defaultState": { "type": "string", "default": "inline" },
    "focusable":    { "type": "boolean", "default": true }
  },
  "root": {
    "type": "Switch",
    "on": "defaultState",
    "cases": {
      "inline": {
        "type": "Button",
        "visibleWhen": "focusable",
        "action": { "type": "setValue", "values": [{ "key": "defaultState", "value": "focused" }] },
        "style": { "direction": "row", "align": "center", "gap": "3", "padding": "4", "radius": "lg", "border": "subtle" },
        "children": [{ "type": "Text", "bind": { "value": "title" }, "style": { "font": "body.md", "weight": "semibold", "color": "text.primary" } }]
      },
      "focused": {
        "type": "Box",
        "style": { "direction": "column", "gap": "3", "padding": "5", "radius": "lg", "background": "surface.base", "shadow": "lg" },
        "children": [
          { "type": "Text", "bind": { "value": "title" },  "style": { "font": "headline.sm", "color": "text.primary" } },
          { "type": "Text", "bind": { "value": "detail" }, "style": { "font": "body.md", "color": "text.secondary" } },
          {
            "type": "Ref", "ref": "close-button",
            "action": { "type": "setValue", "values": [{ "key": "defaultState", "value": "inline" }] }
          }
        ]
      }
    }
  }
}
```

That's a complete, stateful component: `defaultState` is the state, `Switch` picks the view,
`setValue` flips it, the renderer redraws. Drop the folder in `rx/components/` — it's
discoverable immediately (no registration).

---

## 5. Composition — atoms (`Ref`), `$include`, `Each`

**Atoms (`Ref`)** — shared partials in `rx/atoms/` (e.g. `button`, `account-row`,
`section-header`, `close-button`). A `Ref` inlines an atom and **remaps its fields** via
`props` (the atom's bind field ← your data field). It may also override `visibleWhen`,
`action`, or `style`:

```jsonc
// atom rx/atoms/account-row.json binds label/sub/meta…
{ "type": "Ref", "ref": "account-row",
  "props": { "label": "name", "sub": "accountNumber", "meta": "bankName" },
  "action": { "type": "setValue", "values": [{ "key": "step", "value": "amount" }] } }
```

**`$include`** — split a big definition into sibling files (same folder). The included file is a
**bare node** (no envelope). Use it to give each *view* its own file:

```jsonc
{ "$include": "step-source" }   // ← rx/components/<name>/step-source.json
```

**`Each`** — repeat a subtree over a bound array; each item is the data scope for one copy:

```jsonc
{ "type": "Each", "bind": { "items": "beneficiaries" },
  "template": { "type": "Ref", "ref": "account-row", "props": { "label": "name" } } }
```

**Rule of thumb:** shared look → **atom**; whole alternate view → **`$include` + `Switch`**;
repeated item → **`Each`**.

---

## 6. Where state lives (the 3 buckets)

A "state" is just field values in one of three buckets (full detail:
[`UNOVERSE_STATE_MODEL.md`](./UNOVERSE_STATE_MODEL.md)):

| Bucket | Holds | Write with |
|---|---|---|
| **Component state** | one slice per component — data **and** its view-state (`step`, `defaultState`) | `setValue` (or streamed `COMPONENT_DATA`) |
| **Template state** | the template's bag — `draft` + dev-named keys (`openPanel`) + the standard `defaultState` key (`"focus"`) | `setTemplateValue` |
| **Conversation** | the turn timeline; `isStreaming`/`isEmpty` are **derived**, not stored | the stream |

You pick the key **and** the bucket — the SDK hardcodes no UI concept.

---

## 7. The four moves (reacting to state)

**One predicate, three uses.** `visibleWhen`, `Switch`, and `style.when` evaluate the same
**`Condition`**: pick one of `eq` / `ne` / `in`, or — with none — a truthy test. It is a small
declarative layer, **not** a language: no `and`/`or`/arithmetic.

### a. `visibleWhen` — a *small* thing appears/disappears
```jsonc
"visibleWhen": "focusable"                                  // truthy (empty array = empty)
"visibleWhen": { "field": "status", "eq": "error" }
"visibleWhen": { "field": "step", "in": ["recipient", "amount", "review"] }
```

### b. `Switch` — a *whole view* swaps (wizard / inline↔focused)
```jsonc
{ "type": "Switch", "on": "step",
  "cases": {
    "source":    { "$include": "step-source" },
    "amount":    { "$include": "step-amount" },
    "default":   { "$include": "step-source" }
  } }
```
The branch for `data.step` renders; else `cases.default`; else nothing. Mutually exclusive in
**one place** — safer than repeating `visibleWhen` on every sibling.

### c. `Each` — repeat over data (see §5).

### d. `style.when` — the *same* element restyles by state (no cloning)
```jsonc
{ "type": "Box",
  "style": { "background": "surface.sunken",
             "when": [{ "field": "active", "eq": true, "apply": { "background": "status.success" } }] } }
```
The data-driven generalization of `style.disabled`; matching variants merge `apply` over the
base (later wins).

### Worked example — the stepper, before & after
Old: **two Boxes per dot** (one `eq`, one `ne`) just to swap a colour — six near-identical
blocks for three dots. New: one element + `style.when`, and ideally **make the dots data** so
the node sends `steps: [{ label, active }]` and you `Each` over them:

```jsonc
{ "type": "Each", "bind": { "items": "steps" },
  "template": { "type": "Box",
    "style": { "background": "surface.sunken",
               "when": [{ "field": "active", "eq": true, "apply": { "background": "status.success" } }] },
    "children": [{ "type": "Text", "bind": { "value": "label" } }] } }
```
Six hand-written blocks → one templated dot.

---

## 8. Your first template

A template is the **layout shell**: it places where the streamed components and the
conversation go, using two template-only primitives.

- **`ComponentSlot`** — pulls components out of the store by type:
  ```jsonc
  { "type": "ComponentSlot",
    "select": { "type": ["Card"], "from": "latest", "limit": 1 },   // from: "latest" | "all"
    "fallback": { "type": "Skeleton", "variant": "card" } }          // when zero matches
  ```
  Selection is **timeline-ordered, oldest first**: `from: "all"` walks every turn's
  components from the start of the conversation and `limit` slices from the front. A
  global slot (e.g. a `defaultState: "focus"` surface) must therefore **pin `type`** — an
  untyped `{ "from": "all", "limit": 1 }` shows the conversation's *first-ever*
  component forever, and the component the workflow just streamed in never surfaces.
  (It only looks right in a fresh conversation, where newest and oldest coincide.)
- **`Timeline`** — renders the conversation; you supply the **`user`** and **`assistant`** turn
  subtrees (each turn's `ComponentSlot` is scoped to that turn). Per-turn scope fields:
  `text`, `time`, `streaming`, `empty`, `active`, plus anything in `assistantData`/`userData`:
  ```jsonc
  { "type": "Timeline",
    "assistantData": { "avatarUrl": "https://…", "thinkingText": "Thinking…" },
    "user":      { "$include": "user-turn" },
    "assistant": { "$include": "assistant-turn" } }
  ```

**The app `manifest.json`** (in the template folder) binds it to a workflow and describes it:

```jsonc
{
  "name": "Acme Smart Assistant",
  "description": "…",              // human "what it is" — shows in the Content library list
  "whenToUse": "…",                // SELECTION text — see "Template discoverability" below
  "category": "Assistant",
  "version": "1.0.0",
  "inputSchema": { "type": "object", "properties": { "message": { "type": "string" } } },
  "type":         "template",       // EXPLICIT mode — "template" (swap the surface) | "component" (stream into history). Default "template".
  "binding":      { "workflow": "wf-abc123", "trigger": "inputtrigger1" },  // app owns its workflow + explicit trigger
  "autoTrigger":  false,            // true = fire on load (component apps); false = wait for the user (template apps)
  "previewComponents": ["Card"],    // PURE HINT: what the workflow is expected to surface (mock seed / listing). Does NOT gate what streams.
  "expose":       { "openaiApps": false }
  // "fluidHeight": true            // OPTIONAL override only. Height is normally DERIVED from `type`:
  //                                //   template ⇒ fluid/fill (owns the viewport) · component ⇒ size to content (card in the timeline)
}
```

**`type` is the one signal the router branches on.** `template` → the channel **swaps the whole surface** (`resources/read unoverse://templates/<app>`); the conversation survives because the template owns nothing. `component` → the channel **does NOT swap**; it fires the binding (`autoTrigger`), and the workflow streams the component into the **current** chat history at `chatId:nodeId`, rendered inline by the active template's `Timeline`/`ComponentSlot` (the component self-manages focus via `defaultState` `inline`↔`focused`). What streams is **whatever the workflow emits** — `previewComponents` only says what to expect. See `UNOVERSE_MCP_TEMPLATE_PROTOCOL.md` §4b.

### Template discoverability — `whenToUse` (essential, like nodes)

Templates are added to spatial and discovered by intent (`findIntent`), exactly like MCP
tools and nodes. Discovery embeds `` `${title}. ${whenToUse || description} [${category}]` ``
— the **same contract as the node catalog**, so the same writing rules apply
(`docs-starter/nodes/14-node-discoverability.md`):

- **`whenToUse` is the selection text** — when present it *replaces* `description` in the
  embedding. Write it **outcome-first in the user's vocabulary** ("Transfer or send money —
  pay a beneficiary or move funds…"), never mechanism-first ("Two-column split layout…" ranks
  near layout concepts, not near what users ask for — the template becomes invisible).
- **`description` stays the human "what it is"** (the Content library list line).
- Disqualify by **property**, never by naming a sibling template.
- The manifest wins over the template def for every meta field; the reconcile warns for any
  enabled template missing `whenToUse`. Registry items embed their authored meta **AS-IS**
  (no LLM convert-to-need). Editing `whenToUse` changes the content hash → re-ingests on the
  next train.

---

## 9. Conformance checklist (use this to audit every definition)

Run each definition against these. A "no" is a finding to fix.

**Envelope & placement**
- [ ] Has `unoverse`, `kind`, `name`, `category`, `description`; components also have `whenToUse`.
- [ ] Lives in the right dir (`components`/`templates`/`atoms`); folder form when it uses `$include`.
- [ ] `whenToUse` is generic and selection-focused (no hardcoded agent/workflow names).

**Values (LAW 1 — own zero values)**
- [ ] **No raw `px`/`rem`/`em`/`#hex` anywhere** — token names only (`"color": "text.primary"`,
      `"radius": "lg"`). Sizes use the **space scale** (`"width": "8"`, not `"2rem"`).
- [ ] No invented component-named tokens (`cardMin`, `tile`) — use a generic scale step.

**Data contract**
- [ ] Every `bind`ed field has a matching **prop with a `default`**.
- [ ] Workflow-fed fields are marked **`input: true`**; the rest are static content/config.

**State & reactivity (the heart)**
- [ ] State is a **few shallow discriminants** (`step`, `defaultState`) — not a soup of booleans.
- [ ] **Whole-view swaps use `Switch`** (one place), **not** N siblings each with `visibleWhen eq`.
- [ ] **Conditional styling uses `style.when`** — **no element cloned** under opposite
      `eq`/`ne` `visibleWhen`s just to change a style.
- [ ] Conditions only **read** fields; nothing is **computed** in the template.
- [ ] Anything derived (is-active, totals, formatted values, chosen colour) is computed in the
      **node** and sent as a plain field.

**Composition**
- [ ] Repeated UI uses **`Each`** over data (not hand-written N times).
- [ ] Shared look is an **atom** via `Ref` (not copy-pasted).
- [ ] Alternate views are **`$include` files** selected by `Switch`.

**Sizing (focused / rich layers)**
- [ ] A focused/full-panel layer **caps its height and scrolls its body only** — bounded height
      (`height: full`/`flex: 1` + `minHeight: 0`), chrome pinned, content region `overflow: auto`
      (scrollbar only when needed). Never let content overflow the frame and clip
      (`UNOVERSE_LAYERS.md` §4b).

**Templates only**
- [ ] Uses `ComponentSlot`/`Timeline` for streamed components + conversation (doesn't hardcode them).
- [ ] Every `from: "all"` slot **pins `type`** — selection is oldest-first, so an untyped
      global slot shows the conversation's first-ever component, not the one just streamed (§8).
- [ ] Has a `manifest.json` with an explicit **`type`** (`template`|`component`) and a `binding` (`workflow` + `trigger`); `autoTrigger` matches the mode (component apps usually `true`). Height is derived from `type` — only set `fluidHeight` to **override** it.

**SDK boundary**
- [ ] Required **zero SDK changes**. If you thought you needed a new primitive/style key,
      re-check §7 + the SDK `FRAMEWORK.md` gates — it's almost always data.

---

## 10. The vocabulary (closed set)

Structural: `Box` / `Stack` / `Row` / `Column` · `Each` · **`Switch`** · `ComponentSlot` / `Timeline`.
Leaves: `Text` · `Image` · `Button` · `Input` · `Markdown` · `Skeleton` · `Icon`.
Authoring helpers (expanded server-side): `Ref` (atom) · `$include` (sibling file).
Conditions (shared by `visibleWhen` / `Switch` / `style.when`): `eq` · `ne` · **`in`** · truthy.

`Switch`, `in`, and `style.when` are recent additions (June 2026) — conservative sugar over the
existing redraw model. *How state works did not change*; these just let stateful widgets be
authored cleanly. Adding to this set is an SDK change gated by build-failing guard tests.

---

## 11. Tokens — where values live

`rx/orgs/<org>/styles/` is the only place raw values exist (each org's style set is complete
and self-contained; `rx/orgs/default/styles` is the default token set and the starter you copy
for a new org): `base/` (raw scales: color, spacing, radius, shadow, border, motion,
typography) → `semantic/` + `themes/` (named meanings components use: `text.primary`,
`surface.base`, `action.primary`, `space` steps, `headline.sm`). A brand or dark-mode change is
a theme swap with **zero definition changes**. Need a value with no token? **Add/scale a
token** in your org's `styles/` and reference it — never inline it.

---

## 12. Seeing your states (workbench)

Because a state is just field values, the workbench shows any state by setting those fields and
letting the design react. The Storybook-style **state picker** (Mock mode) is the definition's
own **`states/` folder** (`UNOVERSE_LAYERS.md` §7 — the folder IS the registry): one pill per
layer file, for templates AND components. Clicking a pill activates the state by setting its
selector — a template state's `visibleWhen`, or (component wizard steps) the root `Switch`
discriminant whose case matches the state's name. Mock data comes from prop `default`s. No
fixture file exists — add a state file and the pill appears everywhere (workbench + the served
manifest's `states` projection) with nothing to register. (The earlier `*.states.json` fixture
mechanism is retired — nothing reads it.)
