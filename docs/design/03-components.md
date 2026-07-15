# 03 — Components (contained microapps)

**A component is a light, self-contained app: its manifest is the contract, its layouts are its faces, and everything it shows has exactly one home.**

---

## 📁 The anatomy

```
rx/components/journeyfinder/
├── journeyfinder.json    # envelope: name, nodeSize, outputs, props, state, stateOrder, root
├── manifest.json         # the RENDER CONTRACT + discovery meta (see below)
├── layouts/              # the FACES — one file per master state; filename = state name
│   ├── inline.json       #   the in-conversation card (the universal default)
│   └── focused.json      #   the expanded face (or any custom state: layouts/course.json)
├── states/               # the component's PRIVATE steps (a wizard's questions)
│   ├── careerstage.json … results.json
└── components/           # component-local shared partials (only when 2+ states share a shape)
```

A **flat component** (a simple card, a chart) is the reduced form: just `<name>.json` with its `root` — one face, no manifest, no `layouts/`, no `states/`. Simplicity is the default; structure is **earned**.

- File lookup is case-insensitive by filename; `name` is the display/type name.
- **`components/` vs atoms:** a shape shared across *this component's* states → its own `components/` (`$include`). A shape shared across *many components* (a close button, a choice row) → a universal atom in `rx/atoms/` (`Ref`). Used once → inline it.

---

## 📜 The manifest — the render contract

```jsonc
// rx/components/journeyfinder/manifest.json
{
  "title": "Journey Finder",
  "description": "Personalised course recommendations matched to your goals.",   // what it IS, ≤120 chars
  "whenToUse": "Find the right course or qualification for my career goals…",    // the USER's words — findIntent ranks on this
  "category": "Input",
  "version": "1.0.0",
  "defaultState": "focused"    // the ARRIVAL state — an OPEN name; omit for "inline"
}
```

- **`defaultState` = the state the component arrives in.** An open name (`inline`, `focused`, `course`, anything). The server injects it into the component's scope, so it renders that face the moment it streams in. Default: `inline`.
- **Manifest presence = spatially discoverable.** The discovery meta (`title`/`description`/`whenToUse`) lives here and ONLY here — never duplicated in the envelope. A component that's only ever streamed by a workflow, arrives inline, and needs no discovery can skip the manifest entirely.
- `whenToUse` is **utterance-shaped** — the words a user would say ("find the right course for me"), never selector-shaped dev framing ("use this when the user asks…").

---

## 🏠 Three homes — everything the component shows

| What it is | Where it lives | Example |
|---|---|---|
| **Static content** — copy, titles, option lists, images | **hardcoded literals in the layout** (`value` on Text, `items` on Each, `src` on Image) | a wizard's question text, its hero image |
| **Internal view-state** — the SCALAR keys the component's own actions write | the **`state` block** (initial values) | `step`, `phase`, `progressPct`, `questionLabel` |
| **Workflow-fed data** — what a run streams in | **`props` with `input: true`** (the `default` is the preview mock) | a finder's matched `courses`, the user's real accounts |

Anything else is **slop**, and the linter rejects it. The tell: **an array, object, or URL in the `state` block is never view-state** — it's content (→ hardcode) or data (→ `input: true` prop). A contained microapp usually has an *empty or absent* props block.

```jsonc
// journeyfinder.json (envelope) — the state block is lean scalars only
"state": { "step": "careerstage", "phase": "about", "progressPct": "16%", "questionLabel": "Question 1 of 6" },
"props": {
  "courses": { "type": "array", "input": true, "default": [ /* 3 mock courses for preview */ ] }
}
```

---

## 🎭 The faces — root switches on `defaultState`

Every faced component's root is the same three lines: a `Switch` on `defaultState` whose cases `$include` a layout **named after the state**:

```jsonc
"root": {
  "type": "Box",
  "style": { "width": "full", "height": "full", "container": "inline-size" },
  "children": [
    { "type": "Switch", "on": "defaultState",
      "cases": {
        "inline":  { "$include": "layouts/inline" },
        "focused": { "$include": "layouts/focused" },
        "default": { "$include": "layouts/inline" }    // inline is the universal default
      } }
  ]
}
```

- **The layout filename = the state name.** A custom arrival state `course` gets `layouts/course.json` — no special-casing, any open name works.
- **The face is a state decision, never a width decision.** The same `defaultState` write that makes a template's surface react also flips the face. Container queries (`hideBelow`) are for fine adjustments *inside* a face, never for picking one.
- **A `hideBelow` threshold must be reachable by the card itself** — keep it *below* the layout's own `maxWidth`. A threshold at or above it can only be satisfied by the surrounding surface, so the element shows on a wide Studio stage and silently vanishes in a chat column (linted).
- The component's own buttons move it: expand = `setValue { defaultState: "focused" }`, its focused face carries its own ✕ that sets it back to `"inline"`. **A component writes only its own slice** — how templates react is [04 — State](./04-state.md).

---

## 🧩 Private steps — `states/` + `stateOrder`

A wizard's questions are the component's own states: one file per step in `states/`, listed in the envelope's `stateOrder` (the exact set, in order — Studio's state picker and the mock walk use it):

```jsonc
"stateOrder": ["careerstage", "situation", "subject", "route", "studymode", "commitment", "searching", "results"]
```

Inside a step, an option list is **hardcoded** `items` on an `Each`; picking an option writes the answer + the next step in one `setValue`:

```jsonc
{ "type": "Each",
  "items": [ { "value": "start", "label": "Start my career" }, … ],   // literal content
  "template": { "type": "Ref", "ref": "choice-row",
    "action": { "type": "setValue", "values": [
      { "key": "careerStage", "value": "{{value}}" },
      { "key": "step", "value": "situation" },
      { "key": "progressPct", "value": "33%" }
    ] } } }
```

⚠️ **A state never guards itself** — the root `Switch` (or the step `Switch`) already selects it; a `visibleWhen` re-checking the same discriminant inside a case is an error.

---

## 📋 Component checklist

- [ ] Flat if it can be — structure (`layouts/`, `states/`, manifest) is earned
- [ ] Manifest = render contract: arrival `defaultState` (open name) + discovery meta (no envelope duplicates)
- [ ] Root = `Switch on defaultState` → `layouts/<state>` (filename = state name); `default` case → inline
- [ ] Three homes respected: content hardcoded · `state` block scalar view-state only · `props` all `input: true`
- [ ] `stateOrder` names exactly the `states/` files
- [ ] `./unoverse lint` 0 errors — every rule above is enforced

---

**Next:** [04 — State](./04-state.md) — how components and templates interact.
