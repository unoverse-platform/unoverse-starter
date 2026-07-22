# Playbook — Custom Workflow Nodes

**Read first, in order:**
1. `docs/nodes/CLAUDE.md` — the authoritative agent guide: architecture, PromiseNode vs
   CallbackNode templates, the **non-negotiable rules**, definition essentials,
   capabilities, `whenToUse`.
2. `docs/nodes/01-quick-start.md` — package scaffolding end-to-end.
3. As needed: `02-node-types.md` (choosing the base class), `03-patterns.md`,
   `04-credentials.md`, `06-config-schema.md`, `07-service-connectors.md`,
   `14-node-discoverability.md` (before writing `whenToUse`).

This playbook adds the workflow around those docs — it never overrides them.

## Where files go

One package per integration at `apps/unoverse/nodes/<package>/` — **flat and
self-contained** (its own `package.json`, `src/`, no invented parent/shared folders).
Before writing anything, pick the existing node package closest to your shape (a
promise-style API call? a streaming callback? a service provider?) and **mirror its
folder layout exactly**.

For the minimal complete shape — including FULL `package.json` and `tsconfig.json`
listings (`main: dist/index.js`, `build: tsc`, plugin-base dep) — the onboarding
tutorial's Quote node is the canonical small exemplar:
`docs/onboarding/03-create-your-first-node.md`. Never hand a user a package missing
those two config files; a name-only package.json does not build or load.

## Workflow

1. **Decide the node type first** (CLAUDE.md): request→result = PromiseNode;
   long-lived / streaming / multi-event = CallbackNode.
2. **Scaffold** by copying the closest existing package; rename package + node type.
   The package must be in the workspace (`apps/unoverse/nodes/*` is already a
   workspace glob) and use the platform npm scope.
3. **Definition**: every field from "Node definition essentials" — and treat
   `whenToUse` as make-or-break: it decides whether the node surfaces in the catalog
   at all. Outcome-first, 1–2 sentences, self-disqualify by property, never name a
   specific agent node as the attach target (say "an agent node").
4. **Executor**: follow the non-negotiable rules to the letter — `executeNode()` /
   `handleEvent()` (never `execute()`), outputs wrapped in `__outputs`, CallbackNode
   emits outputs and returns completion separately, credentials fetched by the
   service from the passed context (never read `context.credentials.*` in an
   executor), `context.api` not global state, `this.logger` not ad-hoc loggers.
5. **Config**: mark every workflow-fed input in the definition — a config value the
   workflow supplies at runtime is an input, not a hardcoded default.

## Build, deploy, verify

```bash
npm install                                  # once, workspace root
./unoverse build @unoverse-platform/<pkg>    # build one package + restart unoverse
# or: ./unoverse update nodes                # rebuild all node packages + restart
```

The engine loads the node catalog **at boot** — a rebuild without a restart appears to
do nothing. Then verify:

```bash
./unoverse check                             # catalog + health
# node visible? (4106 is internal to the container)
docker compose exec unoverse node -e \
  "fetch('http://127.0.0.1:4106/nodes').then(r=>r.json()).then(d=>console.log(d.nodes.map(n=>n.type).filter(t=>/<YourType>/i.test(t))))"
```

Finally exercise the node in a real workflow on the Canvas — a node that builds but has
never executed is not done. If it misbehaves, stop editing and diff against the
reference package you mirrored; pin the exact repro before changing code.
