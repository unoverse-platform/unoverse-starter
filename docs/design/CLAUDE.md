# Unoverse Design — Agent Rulebook

Condensed, non-negotiable rules for building Unoverse components and templates. Full journey: [README](./README.md), docs 01–09. Deep reference: `docs/unoverse/UNOVERSE_AUTHORING.md`, `UNOVERSE_STATE_MODEL.md` (§5b = the reaction contract), `UNOVERSE_LAYERS.md`, `UNOVERSE_CONFORMANCE.md`.

---

## 1. The architecture in one paragraph

UI is **data**: neutral JSON in `rx/`, rendered natively per platform by a dumb, style-free SDK. Templates are **MCP Apps** (manifest = the envelope; sends = `tools/call`; answers = elicitations; state on the MCP `/stream`). Interaction follows the **reaction contract**: a component writes ONLY its own slice; templates are pure views that react via state selectors; **inline is the universal default**. You author data; you never touch the SDK, transport, or platform code.

## 2. The anatomy (both kinds share the folder grammar)

| | Component | Template |
|---|---|---|
| Contract file | `manifest.json` = render contract (arrival `defaultState`, open name, default `"inline"`) + discovery meta (`title`/`description` ≤120/`whenToUse` utterance-shaped). Presence = discoverable; envelope never duplicates it | `manifest.json` = THE envelope: name/whenToUse/`defaultState`/`inputSchema`/`stateOrder`/`binding{workflow,trigger}`/`layout`/`service?` — no `<name>.json` |
| Envelope | `<name>.json`: name/category/`nodeSize`/`outputs`/`props`/`state`/`stateOrder`/`root` | — |
| Faces/root | `root` = `Switch on defaultState` → `$include layouts/<state>` (**filename = state name**: `layouts/inline`, `layouts/focused`, custom `layouts/course`); `default` case → inline | root = `layouts/<manifest.layout>.json` (default `main`) |
| Layers | `states/` = private steps (wizard questions) + `stateOrder` names exactly those files | `states/` = the template's layers (welcome/conversation/focus) + `stateOrder` in the manifest |
| Local partials | `components/` (earned: 2+ states share a shape); cross-component shapes = atoms in `rx/atoms/` (`Ref`) | `components/` (header, composer-bar, turns) |
| Flat form | just `<name>.json` + `root` — one face, no manifest/layouts/states. Structure is EARNED | — |

## 3. Three homes — everything a component shows (slop rule)

1. **Static content** → hardcoded LITERALS in the layout (`value`, literal `items: []` on Each, `src`). Never props, never `state`.
2. **`state` block** → **SCALAR internal view-state only** (`step`, `phase`, `progressPct`) with initial values. An **array/object/URL in `state` is slop** — the linter rejects it.
3. **`props`** → ONLY `input: true` workflow-fed data (a finder's matched `courses`), `default` = the preview mock. Usually empty.

Arrival `defaultState` lives in the **manifest**, not the state block.

## 4. The reaction contract — state-selected UI (STATE_MODEL §5b)

- **A component is a `Switch` of views, one active.** State is **local**; the **view** (`defaultState`) is the interface — the only thing a template sees. A component's internal state (`step`, `phase`) is private.
- A view changes two ways, both `setValue` into **its own slice**: arrival (manifest `defaultState`) or user interaction. Close = it sets itself back (`inline`); its expanded face carries its own ✕.
- **One instance → one placeholder.** Every view has a placeholder: the **flow** = `inline`; a **reaction surface** = a named view. While a view matches a surface, the instance **lifts out of the flow into the surface** (the SDK renders it in exactly one place — never both). No `hideBelow`/overlay trick to hide a flow copy. An unmatched view stays in the flow. **Many instances** are fine — the template decides a placeholder's layout (flow list / one focus / rail) via `select`.
- Templates react via `ComponentSlot.select.where: { field: "defaultState", eq: "<name>" }` (+ `limit: 1`, most-recent-wins) — **never `type`-pinned, never by id, never on a component's internal state key** (all lint-flagged). Template-focus is DERIVED (does anything match?), never stored.
- `setTemplateValue` = ONLY the template's own chrome (panels, draft). A component writing template state to open a surface is the deprecated bridge — linted.
- Reserved behaviors: `template` swaps the shell; **inline is the universal default**. State names are otherwise OPEN — keep them consistent per org.

## 5. Non-negotiable style/structure rules

1. **Closed primitive set** — `Box Stack Row Column Each Switch ComponentSlot Timeline · Text Image Button Input Markdown Skeleton Icon · Ref $include`. Conditions: `eq ne in` truthy only. Compose; never invent.
2. **LAW 1: zero raw values** — no `px/rem/em/#hex`; **semantic** token names only; style KEYS are closed (no web-isms); dimension VALUES must be real space-scale steps (`0 1 1.5 2 3 4 5 6 7 8 10 12 16 20 24 28 40 50 75 90 100 120 140 160 180 200`, `full`, `auto`) — an invented step is silently broken CSS.
3. **Derived values in the node/workflow** — no arithmetic in definitions.
4. **A component owns its faces and size; the template owns only the framing.** No component-type rules in templates.
5. **A Switch case never re-guards its own discriminant**; one discriminant per axis, no boolean soup.
6. **Never hand-roll transport** — the SDK's MCP path is the only one.
7. **Locked state is read-only**: conversation/lifecycle (project `isStreaming`/`isEmpty`), voice (`service: "voice"` in the manifest; branch on the projected `callState`), host chrome (host props).
8. **Icon quirk**: literal glyph = `icon: "phone"`; bound = `bind: { name: field }`. An atom's `bind` is field-lookup ONLY — a literal passed through `Ref props` into a bind breaks; inline the atom with direct literals instead.

## 6. Workflow checklist

1. Read the matching journey doc ([03](./03-components.md) component / [05](./05-templates.md) template / [06](./06-styles-and-tokens.md) styles); study the exemplars: `journeyfinder`/`cardfinder` (components), `bppchatlayout` (template).
2. Author to the anatomy in §2; put every shown thing in its ONE home (§3).
3. **`./unoverse lint` — 0 errors required**; it enforces §2–§5 with doc-cited messages. Justify any warning.
4. Deploy: `./unoverse gendesign`; then Studio — mock (prop defaults + state picker + Inline/Focused toggle), then live. Debug order: stream log → state inspector → definition. Never edit on a guess.

## 7. Error → fix quick table

| Symptom | Fix |
|---|---|
| Blank image/icon after passing content into an atom | atom `bind` can't take literals — inline the atom, direct `src`/`icon` (§5.8) |
| Renders a field's NAME as text | bare field ref on an absent field — hardcode the literal, or object-form `visibleWhen` |
| Focus surface won't open | the surface must `select.where` on the state the component actually writes; check the state inspector |
| Focus won't close | the component's ✕ must `setValue { defaultState: "inline" }` on ITS OWN slice |
| Component invisible in a template | unknown state name + no matching surface = inline is where it went — check the flow slot exists |
| Style ignored / element auto-sizes | raw value, unknown style key, or off-scale step — lint tells you which |
| Edit does nothing | node contract changed → `./unoverse gendesign` |
| AI never picks it | manifest `whenToUse` is selector-shaped or missing — write the user's words |

Full table: [09 — Troubleshooting](./09-troubleshooting.md).
