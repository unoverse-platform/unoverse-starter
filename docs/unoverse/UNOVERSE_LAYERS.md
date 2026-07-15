# Unoverse — The Layers Model (state-selected UI)

> **Status**: 🎯 Model to adopt (July 2026) — the organizing principle for how state maps to
> UI in `rx/`. Pure data convention; **zero SDK change** (it's `Switch`/`visibleWhen` you
> already have, given a name). A rich stateful component is the natural first migration target.
> **Companion to**: [`UNOVERSE_STATE_MODEL.md`](./UNOVERSE_STATE_MODEL.md) (the state buckets),
> [`UNOVERSE_AUTHORING.md`](./UNOVERSE_AUTHORING.md) (writing definitions),
> [`UNOVERSE_MCP_TEMPLATE_PROTOCOL.md`](./UNOVERSE_MCP_TEMPLATE_PROTOCOL.md) (`defaultState` at the app level).
>
> **One line:** a UI — template *or* rich component — is a **stack of layers**, and a single
> **state value names the active layer**. You never turn parts on/off; you switch the state and
> the matching layer shows. A **state = blocks + data.**

---

## 1. The principle — layers are states

Stop thinking of a definition as a fixed tree with bits toggled on and off (a soup of
`visibleWhen` booleans you coordinate by hand). Think of it as a **stack of layers**, where a
single **discriminant** (a state field) names which layer is active:

- `defaultState` → `inline` | `focused`
- `step` → `income` | `summary` | `result`
- `defaultState` → `base` | `focus` | `modal`

**One value = one layer.** `Switch on <discriminant>` draws the active layer; changing the value
redraws the next one. There is one question per surface — *"which layer?"* — answered by one
value, instead of many independent on/off flags.

Focus stopped being special the moment it became a template-state *value* (`defaultState`, formerly `mode`); layers make
**everything** that way — inline↔focused, wizard steps, tabs, disclosure, empty/loading/loaded,
focus/modal surfaces are all **the same pattern: a discriminant naming a layer.**

### Layers nest — the same primitive all the way down

A template has layers; a template-layer holds components; a component has layers; a
component-layer holds sub-views. Every node owns its own discriminant and picks its own active
layer. Recursive and uniform. (A "layered thing" can also have **several orthogonal
discriminants** — a widget may carry `defaultState` *and* `step`, each its own `Switch`.)

### State selects the view; data fills it

Switching layers **never touches data**. Data arrives the standard way (`COMPONENT_DATA` / props
/ template state) and whichever layer is active binds it. One dataset, many projections — the
same data as a compact card *or* a full panel. The discriminant lives in the owning bucket
(a component's layer → its slice via `setValue`; a template's layer → template state via
`setTemplateValue`) — see `UNOVERSE_STATE_MODEL.md` §5, and §5b for the ownership
contract (templates own template states; components own component states; the arrival
state is the one bridge). No new mechanism, no new SDK.

---

## 2. The structure — `layouts/` + `states/` + `components/`

> Naming (July 2026): the shared-shapes folder is **`components/`** (formerly `blocks/`), and the
> master faces live in **`layouts/`** — the layout filename IS the state name (`layouts/inline`,
> `layouts/focused`, or any custom state). The rules below are unchanged.

A **rich** thing (a template or component that actually has layers) is organized as:

```
<thing>/
  <thing>.json     ← ROOT: the selector(s) — Switch on the discriminant — + any shell
  manifest.json    ← templates only (the app: mode, binding, …)
  components/          ← OPTIONAL — present ONLY when a shape is shared by 2+ states. Each lives ONCE.
  states/          ← LAYERS: thin — each ties a discriminant value → components/inline shape + its data.
```

- **`components/`** = the *how it looks* — pure shapes, no data baked in (a section-header, an
  option-list, a result-card, a stepper). A block is written **once** and exists **only** because
  more than one state reuses it. A shape used by a single state is **not** a block — it stays
  inline in that state. (See §3 — extraction is *earned* by reuse.)
- **`states/`** = the *what shows when* — thin. A state file composes blocks (via **`$include`**;
  use `Ref` only for a **global** `rx/atoms/` shape that needs per-use field remapping — local
  blocks are `$include`d) and **binds** the data for that layer. It carries no shape code and no
  data — just *which blocks + what they bind*.
- **root `<thing>.json`** = the **selector**: `Switch on <discriminant>` mapping each value to its
  state, plus any always-on shell (header, close button).

**One clean sentence: a state = blocks + data.**

---

## 3. The guardrail — what earns a `states/` file

This is what keeps `states/` small and stops the duplication from creeping back:

> **A new `states/` file is earned only by a different *arrangement of blocks* (or a different
> *set of bound fields*). Same blocks + same fields, different *values* → ONE state, data-driven —
> not a new file.** The discriminant then just selects the *data*, not the layout.

And its corollary:

> **A layer never guards itself.** Its selector (`Switch`) owns "which layer is active." A state
> file must **not** re-check `visibleWhen: { field: <discriminant>, eq: <its-own-value> }` — that
> double-guard is the "fighting components on/off" smell the model removes.

Most "states" turn out to be **data, not layers.** Only a genuine shape-change earns a file.

### 3a. The root is the design — don't scatter identity

Extraction serves **reuse** and **repetition**, never fragmentation. The **root reads as the
design**: open a rich component's root and you should see *what the thing is* — e.g. a widget that
flips between a compact `inline` card and a `focused` panel. Those two are the design's
**identity**, not reusable parts or repeated variants, so they **stay in the root**. Pulling them
into `states/` would leave a thin assembler that tells you nothing about what the thing *is*.

> **Extract only when it earns it:**
> - to **`components/`** → a shape that is **reused** (by 2+ states).
> - to **`states/`** → a layer that is **repeated** (many siblings, like wizard steps) *or*
>   **large-and-independent** enough that inlining it would bury the root.
> - **a design's few defining states stay in the root** — they *are* the design.

So a widget's `inline` ↔ `focused` views stay in the root (the identity); repeated question steps
that share one shape collapse into **one** data-driven `states/` file; a shape is pulled to
`components/` only if two or more states share it. The root stays legible.

---

## 4. Dumb shells vs rich things

The structure only appears where there is real layering:

| Kind | Example | Has `components/` + `states/`? |
|---|---|---|
| **Dumb shell** — a bare mount point | a passthrough template (one `ComponentSlot`) | ❌ no — one file, nothing to organize |
| **Rich thing** — owns layers | a stateful widget component · a chat template | ✅ yes |

**The richness lives in one place, and it's portable.** A stateful component carries its own
layers wherever it goes:

- Dropped in a **dumb** passthrough shell → it *is* the whole surface, fills naturally.
- Streamed into a **rich** chat template → *that* template's focus layer frames it on top of
  the conversation.

Same component, different framing per template — exactly `UNOVERSE_STATE_MODEL.md` §5a. Clean
division: **the component owns its states; the template owns whether/how to frame them.**

### 4a. Sizing — the dumb host responds; the component owns it

A **dumb template has no size opinion.** It's a passive host that **responds to** whatever size
its component reports — it never imposes one. **Size is a property of the component's active
state**: `inline` is a small card, `focused` is a full panel; the size *is* which layer shows.

| Host | Sizing responsibility |
|---|---|
| **Dumb template** (passthrough) | none — passive, **responds to** the component's size |
| **Component** | owns it — the active **state / layer** *is* the size |
| **Rich template** (chat focus) | frames on top, but still **responds to** the component's size — never force-fills |

This is why a passthrough host "just works" (the component sizes itself, the host adopts it) and
why a rich host can give trouble (a rich template trying to *impose* fill on a fit-to-content
component). Same law as the SDK boundary: **don't make the container force the size — let the
design own it.**

### 4b. Cap the height, scroll inside — a focused-layer best practice

A component owns its size (§4a), but a **focused/full-panel layer can hold unbounded content** —
a long result card, a many-item summary, a wizard step taller than the surface. When its
content exceeds the space the host gives it, the layer must **not** grow forever or spill past
the frame and get clipped (the classic "runs out of space, cut off at the bottom" bug).

> **Best practice: a focused/rich layer caps its own height and scrolls its own body.** Give the
> layer a bounded height (fill the host, `height: full` / `flex: 1` + `minHeight: 0`), keep the
> **chrome pinned** (header, stepper, footer actions), and make **only the content region**
> `overflow: auto` — a scrollbar that appears **only when needed**. The layer stays inside its
> frame on every screen size; short content shows no scrollbar, tall content scrolls.

The pattern, concretely (a focused column):

```jsonc
{ "type": "Box", "style": { "height": "full", "minHeight": "0", "direction": "column" },
  "children": [
    { /* header  — pinned, natural height */ },
    { /* stepper — pinned, natural height */ },
    { /* content region */
      "style": { "flex": "1", "minHeight": "0", "overflow": "auto" },
      "children": [ /* the Switch on the step / the long body */ ] }
  ] }
```

`minHeight: 0` on both the column and the scroll region is the piece people forget — without it
a flex child refuses to shrink below its content and the `overflow` never engages. Keep the
scroll on the **body only**, never the whole layer, so the header/footer never scroll away.

This is the component's job, not the template's (§4a): the host still just responds to the
component's reported size; the component simply promises never to report *more than fits*.

---

## 5. Two layer flavors

Both are driven by the discriminant; pick by relationship:

| Flavor | When | How |
|---|---|---|
| **Exclusive** — one layer shows | welcome vs conversation · wizard steps · inline↔focused | `Switch on <discriminant>` (mutually exclusive, one place) |
| **Stacked** — a layer sits *on top* | a focus/modal surface over a base | a `position: absolute` block, `visibleWhen` the discriminant value (base stays underneath) |

---

## 6. Worked example — a wizard component, before & after

Take a component with a compact `inline` card and a `focused` panel, where the focused panel
walks through **seven questions that are all the same shape** — a section heading plus a list of
choice rows — differing only in their heading text and their options.

**Before (the trap):** seven flat sibling files, most near-identical, each **self-guarding**:

```
wizard/
  wizard.json
  step-1.json  step-2.json  step-3.json  step-4.json
  step-5.json  step-6.json  step-7.json
  summary.json  result.json
```
```jsonc
// step-1.json — redundant self-guard (the Switch already selected it)
{ "type": "Box", "visibleWhen": { "field": "step", "eq": "step-1" }, … }
```

**After (the model):** the seven question steps are **one shape with seven data sets** — one
layer, not seven. The data producer sends the current step's heading and options (and, on each
option row, where it advances to); the state binds them. Only genuinely different arrangements
(`summary`, `result`) earn a file. **Nothing is shared across states, so there is no `components/`
folder** — the always-on chrome (stepper, side image) lives in the **root**, and the question
shape, used by a single state, stays **inline** in it:

```
wizard/
  wizard.json      (root: Switch on defaultState → inline|focused;
                    inside focused, the always-on stepper + shell, then Switch on step → states/)
  states/
    question.json  (the ONE question shape; binds the current step's {heading, options} —
                    the `step` value selects the data, not the layout)
    summary.json
    result.json
```

**9 files → 3 states, 0 blocks.** The `question` state binds the current step's data (sent
standard); the `step` discriminant selects *which data*, never a new layout. No self-guarding
`visibleWhen`, and no extraction that reuse didn't earn.

> **When would `components/` appear?** Only with genuine cross-state reuse — e.g. a chat template
> whose header, composer, and thinking-indicator shapes are each used by its `welcome`,
> `conversation`, *and* `focus` states. Those three shapes earn a block file each; a shape used
> by one state never does.

---

## 7. The payoff — states preview for free (the dumb viewer)

Because states are first-class and **enumerated in `states/`**, the workbench's template/component
viewer can show **every state with no hand-maintained fixture.** The `states/` folder *is* the
list of layers (filesystem-as-registry, exactly like components): the viewer reads it, renders a
**state switcher**, and flipping it just sets the discriminant — the matching layer draws itself.

- Step through `inline → focused → question → summary → result` from a dropdown.
- For a data-driven state (e.g. `question`), the switcher can offer its `step` values too — same
  layer, different bound data — so you see all seven questions without seven files.
- No `visibleWhen` archaeology to work out *what states even exist* — the folder tells you.

This is the direct dividend of state-first organization: a **dumb viewer** becomes a full state
inspector, because the definition already declares its layers instead of hiding them in
conditional soup. (Supersedes the hand-written `*.states.json` fixture of `UNOVERSE_AUTHORING.md`
§12 — the `states/` folder is now the source of truth for what states exist.)

### 7a. Ordering — the root declares it

The `states/` folder gives the **set**; the **root** (`<name>.json`) gives the **order** — the
sequence its `$include: "states/…"` references appear in (children order, or `Switch`-cases
order). Reorder the includes and the picker reorders. **No `order` field, no manifest list, no
`01-`/`02-` filename prefixes to drift.** A state not referenced from the root falls to the end
(alphabetical), so nothing ever vanishes from the list. (Server: `stateOrder` in
`definitions.ts`.)

### 7b. States are served — MCP callers are aware, with zero drift

The same enumeration is **injected into the served app manifest** (`loadAppManifest`), so it
reaches beyond the workbench to **any MCP caller** — `resources/read unoverse://apps/{id}`,
`resources/list`, discovery — as `manifest.states` (each entry = `name` + its `when` selector,
in root order). So a caller doesn't just know *which* states exist; it knows *how to activate*
each (e.g. `{ field: "defaultState", eq: "focus" }`).

Crucially this is **auto-derived, never hand-written** in `manifest.json`: the `states/` folder
stays the single source of truth, the served manifest is a **projection** of it. Add a state →
it appears everywhere (viewer + MCP) with **no file to update, no drift**. That's the whole
reason it doesn't violate "the filesystem is the registry" — we never maintain a second list, we
compute the projection.

---

## 8. Why it fits the framework (no SDK change)

This is **formalizing what already exists**, not new machinery:

- `components/` = shared shapes, composed with **`$include`** (`Ref` stays for **global** `rx/atoms/`
  when a shape needs per-use field remapping — `$include` inlines, it can't remap).
- `states/` = the `$include`d **layer views** — but thin, because the shape lives in `components/`.
- the root's `Switch on <discriminant>` = the **selector** already in the vocabulary.

The three state buckets are unchanged; the discriminant is just a key in the right bucket
(`UNOVERSE_STATE_MODEL.md` §2/§5). The SDK stays a **fixed, generic renderer** — UX is data.
Layers are a *mental model + file convention*, enforced by the guardrail (§3), not by the engine.
