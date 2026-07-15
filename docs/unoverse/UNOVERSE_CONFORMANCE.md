# Unoverse — Conformance (how the rules are enforced)

> **Status**: 🟢 Live end-to-end (July 2026) — schema + guards + the `./unoverse lint` CLI.
> **Audience**: anyone authoring `rx/**` definitions, or maintaining the guards.
> **Companions**: [`UNOVERSE_AUTHORING.md`](./UNOVERSE_AUTHORING.md) (the rules),
> [`UNOVERSE_LAYERS.md`](./UNOVERSE_LAYERS.md) (layouts/states/components), [`UNOVERSE_STATE_MODEL.md`](./UNOVERSE_STATE_MODEL.md) (§5b = the reaction contract).
>
> **One line:** the framework has a lot of prose rules; we turn the *machine-checkable* ones into
> **editor-/build-failing guards** so a new dev is caught early, and we're honest that the
> **judgment** ones can't be a guard.

---

## 1. The principle — prose rule → machine guard

Every rule that can be checked mechanically should be a guard, not tribal knowledge. But a guard
that **false-positives is worse than none** — one wrong red squiggle and people disable it and
stop trusting the suite. So the bar is: **zero false positives on valid definitions**, and only
**hard-fail the unambiguous rules** — everything judgment-y is a warning/hint or a human's call.

Four layers, by *when* they catch you:

| Layer | When | Catches | Where |
|---|---|---|---|
| **JSON Schema** | **as you type** (editor) | shape rules — vocabulary, envelope, primitive completeness, condition form, style keys | `rx/_schema/unoverse.schema.json` |
| **`./unoverse lint`** | **before deploy** (CLI, no deps — ships in the starter) | everything below, with doc-cited messages; 0 errors required | `scripts/lib/lint.mjs` |
| **Guard tests** | on `npm test` / CI | the same rules server-side, on the **composed** tree | `server/src/runtime/*.test.ts` |
| **SDK closed-set** | on SDK build | the primitive set + the feature-free state machine are frozen | `unoverse/react/test/closed-set.test.mjs`, `core/test/state-model.test.mjs` |

---

## 2. The JSON Schema (editor guidance)

**File:** `apps/unoverse/rx/_schema/unoverse.schema.json` · **Wired in:** `.vscode/settings.json`.

Inline, before you ever run anything: autocomplete of the 16 primitives; errors on an invalid
`type`; a broken `Switch` (no `on`/`cases`), `Each` (needs `template` + literal `items: []` or
`bind.items`), `Ref` (no `ref`), `ComponentSlot` (no `select`); a bad condition
(`and`/`or`/arithmetic — only `eq`/`ne`/`in`/truthy); an **unknown style key** (the closed
cross-platform vocabulary, incl. inside `hover` and `when[].apply`).

- **One schema, two shapes.** A file with `unoverse` validates as an **envelope**; a bare-node
  partial (`layouts/`, `states/`, `components/`, `$include` siblings) validates as a **node**.
- **Envelope meta is minimal** — a component requires `category` only; `description`/`whenToUse`
  live in the **manifest** when the component is discoverable (never duplicated).
- **Structural, never textual** on data positions: `bind` / `props` / `action` values stay
  freeform, so a data value is never mistaken for a node type. Zero false positives is the bar —
  re-run the lint sweep after any schema change.

---

## 3. `./unoverse lint` + the guard tests (one rule set, two homes)

The CLI (`scripts/lib/lint.mjs`) runs at authoring time and **mirrors** the server guards
(`server/src/runtime/*.test.ts`), which re-check on CI against the composed tree. The rules:

| Rule | Level | Guard twin |
|---|---|---|
| LAW 1 — tokens only, no raw `px`/`rem`/`#hex` (`styles/` is the value layer) | error | `definition-tokens.test.ts` |
| Closed primitive set + required fields per primitive | error | schema + `closed-set` |
| Closed **style keys** + **space-scale steps** (an invented step = silently broken CSS) | error | — (lint-first) |
| `$include`/`Ref` resolution — everything composes | error | `…: fully expands` tests |
| A `Switch` case never re-guards its own discriminant | error | `self-guard.test.ts` |
| **Microapp three homes** — all `props` are `input: true`; the `state` block is **scalar
  view-state only** (an array/object/URL in `state` is slop) | error | `microapp-structure.test.ts` |
| **Faces** — a faced component's root is `Switch on defaultState` → `layouts/<state>`
  (filename = state name) and declares its arrival state in the **manifest** | error | `microapp-structure.test.ts` |
| **Manifests** — discovery meta (`description` ≤120; `whenToUse` utterance-shaped, no
  selector-framing, no sibling names; no envelope duplication); a template manifest resolves its
  `layout` and `stateOrder` = the `states/` files | error | `microapp-structure` + `discoverability-meta` |
| **Reaction contract** — flags the deprecated bridge (a component writing `defaultState` into
  template state; a top-level envelope `defaultState`) | warn | — |
| A `from: "all"` slot with no `where` and no `type` (reaction surfaces select by **state**) | warn | — |
| Theme token contract across orgs | — (CI) | `theme-contract.test.ts` |

---

## 4. What a guard can NOT check — be honest

Judgment calls stay in the docs + code review; a linter that pretends to check them trains
people to ignore warnings:

- **"structure is earned"** — flat if it can be; extract for reuse/repetition, don't scatter identity.
- **"few shallow discriminants, not boolean soup"** (authoring §9).
- **"derived values computed in the node"** (authoring §9).
- **"same-shape states should collapse to one data-driven state"** — heuristically detectable, humanly decided.
- **state-name consistency per org** (`focused` vs `focus` fragments the selector vocabulary) — convention.

---

## 5. Maintenance — avoid drift

- **Name the rule.** Each check cites its doc section; when a rule changes, both move.
- **One source for each closed set.** Primitives: SDK `closed-set.test.mjs` + the schema enum.
  Style keys: the SDK style interpreter + schema + lint. Scale steps: read live from the orgs'
  `base/spacing.json`. Keep them equal or they disagree silently.
- **Lint and guards must agree.** The CLI mirrors `microapp-structure`/`self-guard`/
  `definition-tokens`; a rule added to one is added to the other in the same change.
- **Never trade a false positive for a catch.** The suite is only trusted while every valid
  file passes — re-run `./unoverse lint` + `npm test` after any change.
