# Playbook — Components & Atoms (rx data)

**Read first:** `docs/design/03-components.md` (the microapp anatomy) + `docs/design/04-state.md`
(the reaction contract). Deep law: `docs/unoverse/UNOVERSE_AUTHORING.md` §3 (three homes),
`UNOVERSE_STATE_MODEL.md` §5b. **Study the exemplars before writing**: `rx/components/journeyfinder`
and `rx/components/cardfinder` — mirror them exactly.

## The anatomy

```
apps/unoverse/rx/components/<name>/
  <name>.json      # envelope: name/category/nodeSize/outputs/props/state/stateOrder/root
  manifest.json    # RENDER CONTRACT: arrival defaultState (open name, default "inline")
                   #   + discovery meta (title / description ≤120 / whenToUse utterance-shaped).
                   #   Presence = spatially discoverable; envelope NEVER duplicates the meta.
  layouts/         # the FACES — filename = state name: inline.json, focused.json, (custom).json
  states/          # the component's PRIVATE steps (wizard questions) — listed in stateOrder
  components/      # component-local shared partials (earned: 2+ states share a shape)
```

A **flat component** (simple card/chart) is just `<name>.json` + `root` — one face, no manifest,
no folders. Structure is EARNED; start flat.

## The rules (lint enforces all of these — 0 errors required)

1. **Three homes for everything it shows** (AUTHORING §3):
   - static content → **hardcoded literals** in the layout (`value`, literal `items: []` on
     Each, `src`) — never props, never `state`;
   - internal view-state → the **`state` block, SCALARS ONLY** (`step`, `phase`,
     `progressPct`) — an array/object/URL in `state` is slop (workflow data → props;
     static → hardcode);
   - workflow-fed data → **`props` with `input: true`** (the `default` is the preview mock).
     Usually empty.
2. **Root = `Switch on defaultState`** — the component is a switch of **views**, ONE active.
   Cases `$include layouts/<state>` (filename = view name); `default` → the inline layout.
   Arrival view = **manifest.defaultState**. Always keep an `inline` case — it is the
   component's placeholder in the conversation flow.
3. **State is local; the VIEW is the interface** (STATE_MODEL §5b). Internal `state`
   (`step`, `phase`, …) is the component's own business — the template never sees it. The
   only thing that crosses to the template is the **active view** (`defaultState`). The
   component writes ONLY its own slice (`setValue`): expand = `setValue { defaultState:
   "course" }`; its expanded face carries its own ✕ back to `"inline"`. When a template has
   a surface for that view, the instance **lifts out of the flow into the surface** — the
   SDK renders each instance in exactly ONE placeholder, so you never hide a flow copy
   yourself (no `hideBelow`, no overlay hack). ❌ NEVER `setTemplateValue` to open a surface
   (the deprecated bridge — linted).
4. **`stateOrder`** names exactly the `states/*.json` files, in order.
5. **Atoms** (`rx/atoms/`, via `Ref`) are for shapes shared across components. ⚠ An atom's
   internal `bind` is field-lookup ONLY — you cannot pass a literal through `Ref props`
   into it; for content-bearing pieces, inline the atom with direct literals instead.
   ⚠ Icon: literal = `icon: "phone"`; bound = `bind: { name: field }`.
6. **Tokens only** (LAW 1) + closed style keys + real space-scale steps
   (`docs/design/06`) — an invented step is silently broken CSS.

## Workflow

1. Study the closest exemplar; copy its folder shape.
2. Write the envelope + manifest + layouts; put every shown thing in its ONE home.
3. `./unoverse lint` — 0 errors (it cites the doc for every rule).
4. Restart unoverse → Studio: mock (prop defaults + state picker + Inline/Focused
   toggle), then live. Debug: stream log → state inspector → definition; never guess.
