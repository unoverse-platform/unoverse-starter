# 08 — Validate & Ship

**Three enforcement layers catch mistakes for you; one checklist covers what only you can judge.**

The one command to remember:

```bash
./unoverse lint
```

It runs the schema rules, the token law, and the state/structure rules over every definition, with each message citing the doc that owns the rule. Errors fail; warnings flag judgment calls (e.g. an untyped global slot); hints suggest niceties (a missing states fixture). Run it before every restart/deploy.

---

## 🛡️ Layer 1 — The JSON Schema (as you type)

`rx/_schema/unoverse.schema.json` validates every definition in your editor (wiring in [01](./01-quick-start.md)). Structural, zero false positives. It catches:

- missing envelope fields (`unoverse`, `kind`, `name`, `root`; components also need `category` — discovery meta lives in the **manifest**)
- an unknown primitive `type` (the closed set is encoded)
- broken primitives — `Switch` without `cases`, `Each` without `template` + a list (literal `items` or `bind.items`), `Ref` without `ref`, `ComponentSlot` without `select`
- illegal conditions — only `eq` / `ne` / `in` / truthy exist; `and`/`or`/arithmetic are rejected by design (derive in the node, [03](./03-components.md))

It validates two shapes: **envelope** files (with the `unoverse` field) and **bare node** partials (`layouts/`, `states/`, `components/`, atoms).

One-off sweep of everything from the CLI (needs `ajv` once: `npm i -D ajv` at the repo root):

```bash
# from the repo root — validate every definition against the schema
node -e 'const A=require("ajv");const fs=require("fs"),p=require("path");
const v=new A({allErrors:true,strict:false}).compile(JSON.parse(fs.readFileSync("apps/unoverse/rx/_schema/unoverse.schema.json")));
const w=d=>fs.existsSync(d)?fs.readdirSync(d).flatMap(f=>{const q=p.join(d,f);return fs.statSync(q).isDirectory()?w(q):(f.endsWith(".json")&&f!=="manifest.json"&&!f.endsWith(".states.json")?[q]:[])}):[];
let bad=0;for(const d of["apps/unoverse/rx/components","apps/unoverse/rx/atoms","apps/unoverse/rx/orgs"])for(const f of w(d))if(!v(JSON.parse(fs.readFileSync(f)))){bad++;console.log("✗",f,v.errors[0].instancePath,v.errors[0].message)}
console.log(bad?bad+" invalid":"clean ✓")'
```

---

## 🛡️ Layer 2 — `./unoverse lint` (authoring time)

The same rules the platform's guard tests enforce in CI, runnable in seconds from your repo:

| Rule | Enforces | Level |
|---|---|---|
| **tokens** | LAW 1 — no raw `px`/`rem`/`em`/`#hex` in any definition (`styles/` exempt — it IS the value layer) | error |
| **closed set** | only the frozen primitive vocabulary; `Switch`/`Each`/`Ref`/`ComponentSlot` carry their required fields | error |
| **style keys** | only the portable style vocabulary — the cross-platform contract; typos and web-isms rejected (incl. inside `hover`/`when.apply`) ([06](./06-styles-and-tokens.md)) | error |
| **conditions** | only `eq`/`ne`/`in`/truthy — no `and`/`or`/arithmetic; `style.when` entries carry `field` + `apply` | error |
| **self-guard** | a `Switch` case never re-checks its own discriminant ([03](./03-components.md)) | error |
| **resolution** | every `$include` path and `Ref` atom actually exists | error |
| **space scale** | dimension values are real scale steps — an invented step is silently broken CSS ([06](./06-styles-and-tokens.md)) | error |
| **microapp: three homes** | all `props` are `input: true`; the `state` block is SCALAR view-state only (arrays/objects/URLs = slop) ([03](./03-components.md)) | error |
| **microapp: faces** | a faced component's root is `Switch on defaultState` → `layouts/<state>` (filename = state name) and declares its arrival state (manifest) | error |
| **manifests** | discovery meta correct (`description` ≤120, `whenToUse` utterance-shaped, no envelope duplicates); a template manifest resolves its `layout` and its `stateOrder` matches `states/` | error |
| **reaction contract** | flags the deprecated bridge — a component writing `defaultState` into template state, or a top-level envelope `defaultState` ([04](./04-state.md)) | warn |
| **global slots** | `from: "all"` with no `where` and no `type` — a reaction surface selects by state ([05](./05-templates.md)) | warn |
| **states picker** | a definition with layers (a `Switch`) but no `states/` folder ([07](./07-studio.md)) | hint |

The platform's own CI additionally runs the **theme-contract** and **discoverability-meta** guards, and the SDK build enforces the **closed set** at the renderer level — you can't drift past them even if you skip lint.

---

## 🛡️ Layer 3 — Your judgment (the conformance checklist)

What no linter can decide — audit every artifact against this before calling it done:

**Structure**
- [ ] Structure is **earned** — flat if it can be; `components/`/`states/`/`layouts/` only when the shape demands them
- [ ] Few shallow discriminants, not boolean soup; same-shape states collapsed into one data-driven state
- [ ] No self-guarding states; mutually exclusive views in ONE `Switch`

**Data**
- [ ] Every `bind` has a prop/state key **with a default**
- [ ] Derived values computed in the node, sent as plain fields — no logic simulated in the definition

**State ([04](./04-state.md))**
- [ ] Reaction contract respected — a component writes only its own slice; template surfaces react via `select.where`; `setTemplateValue` only for the template's own chrome
- [ ] Locked state respected — lifecycle from derived flags, voice via `callState`, host chrome via `props`

**Templates ([05](./05-templates.md))**
- [ ] No component-type rules in slots; reaction surfaces select by `where`; components own their size and faces
- [ ] Manifest binds the workflow; `whenToUse` outcome-first, disqualifies by property

**Style ([06](./06-styles-and-tokens.md))**
- [ ] Semantic tokens only; no invented component-named tokens

---

## 🚢 Ship

```bash
./unoverse lint          # clean?
docker compose restart unoverse    # component nodes re-synthesize from rx/ (no codegen)
./unoverse check         # health check: services, endpoints, node catalog
```

Then the final gate — **Studio, live mode** ([07](./07-studio.md)): stream real data through it, exercise every state fixture, watch the stream log stay clean. That preview runs the production path, so it is the release test.

---

**Next:** [09 — Troubleshooting](./09-troubleshooting.md).
