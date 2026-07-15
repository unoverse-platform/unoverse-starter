# Playbook — Templates (MCP apps)

**Read first:** `docs/design/05-templates.md` (manifest-as-envelope + reaction surfaces) +
`docs/design/04-state.md` (the reaction contract). Deep law: `UNOVERSE_STATE_MODEL.md` §5b,
`UNOVERSE_LAYERS.md`. **Study the exemplar**: `rx/orgs/bpp/templates/bppchatlayout` — mirror
it exactly. Everything in the component playbook (closed vocabulary, tokens, scale steps)
applies here too.

## The anatomy — manifest-only (NO `<name>.json` envelope)

```
apps/unoverse/rx/orgs/<org>/templates/<name>/
  manifest.json    # THE ENVELOPE — the whole app contract (below)
  layouts/
    main.json      # the root tree (named by manifest.layout, default "main")
  components/      # template-local partials (header, composer-bar, turns, suggestions…)
  states/          # the template's layers (welcome, conversation, focus…)
```

## manifest.json (the app contract)

Required: `name` · `description` (what it IS, ≤120) · `whenToUse` (utterance-shaped — the
USER's words; findIntent ranks on it; disqualify by property, never by naming siblings) ·
`category` · `defaultState` (the app's load state: `"template"` = the full surface) ·
`inputSchema` · `stateOrder` (= the `states/` files, in picker order) ·
`binding` (`workflow` + `trigger` — the app OWNS its workflow; without a real binding it
is not done) · `layout`. Optional: `width`/`focusWidth`, `autoTrigger`, `expose`,
`service` (`"voice"` — the channel instantiates the native service, which projects
`callState` into scope).

**The generalist trap:** a home/fallback surface must NOT enumerate its siblings' jobs —
it owns general help and cedes specific jobs by property, naming none.

## Surfaces — templates REACT, they never own

**The model — state-selected UI (one instance → one placeholder).** A component instance is
a `Switch` of **views** (one active). Every view has a **placeholder**: the conversation
**flow** is the placeholder for `inline`; a **reaction surface** is the placeholder for a
named view (`course`, `focused`). The active view fills **exactly one** placeholder — the
SDK keeps a claimed instance **out of the flow**, so a surface and the flow never paint the
same instance twice (you do NOT hide the flow copy yourself — no `hideBelow` trick, no
overlay-to-cover). The template only ever **frames**; the component owns its faces. A source
may create **many instances** (many courses); the template decides how a placeholder lays
them out (a flow list, one focus, a rail/grid) via `select` (`limit`, ordering).

- **Flow slot** (the `inline` placeholder): `{ "type": "ComponentSlot", "select": {} }` —
  renders the instances whose active view is `inline` (or a view no surface claims — the
  fallback). Always present.
- **Reaction surface** (the placeholder for a named view): select by the **view**
  (`defaultState`), never by component type or id:

  ```jsonc
  { "type": "ComponentSlot",
    "select": { "from": "all", "where": { "field": "defaultState", "eq": "focused" }, "limit": 1 },
    "frame": { /* the surface chrome; an inner ComponentSlot marks the placement */ } }
  ```

  The instance lifts out of the flow into this surface while its view matches; its own ✕
  switches back to `inline` and it returns to the flow. ❌ `select: { type: [...] }` (naming
  a component) and ❌ `where.field` other than `defaultState` (reaching into a component's
  private internal state) are both violations — lint flags them. ❌ Template chrome never
  writes a component's slice.
- **Template state** (`setTemplateValue`) is ONLY for the template's own chrome — a
  disclosure panel (`openPanel`), the composer `draft`. "Is something focused" is DERIVED
  (does anything match the selector) — never stored.
- A **custom state** (`course`, anything) = add a surface with `where: { eq: "course" }`;
  templates that don't know the name render those components inline. Zero protocol change.
- A focused/full layer caps its height and scrolls its BODY only (header/footer pinned;
  `flex: 1` + `minHeight: 0` + `overflow: auto`).

## New org?

`rx/orgs/<org>/` = `templates/` + a **complete self-contained** `styles/` (copy
`rx/orgs/default/styles` and re-value the base scales). No fallback, no overlay. Addresses:
apps `unoverse://apps/<org>/<name>`, themes `unoverse://theme/<org>/<theme>`.

## Validate & ship

1. `./unoverse lint` — 0 errors (manifest layout/stateOrder, reaction rules, tokens, steps —
   all enforced with doc-cited messages).
2. `./unoverse gendesign` to regenerate + restart.
3. **See it**: Studio — the state picker walks the `states/` layers; then run it live and
   verify the bound workflow streams components into the flow, and reaction surfaces frame
   them, end-to-end.
