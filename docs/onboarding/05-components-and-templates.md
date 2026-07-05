# Challenge 5: Components and Templates

Build UI on Unoverse — restyle an existing component live, then create your own.

## How UI Works Here

Components, templates, and styles are **JSON definitions** rendered by the platform's
SDK — no React code, no CSS. You describe *what the UI looks like for a given state*
using a small closed vocabulary of primitives (`Box`, `Text`, `Image`, `Button`,
`Each`, `Switch`, …), and every visual value is a **token name** (`text.primary`,
`radius.lg`) resolved by the active theme.

Everything lives in `apps/unoverse/rx/`:

| Path | What |
|---|---|
| `rx/components/<name>/<name>.json` | Universal components |
| `rx/atoms/<name>.json` | Shared partials (buttons, rows) composed via `Ref` |
| `rx/orgs/<org>/templates/<name>/` | Org-scoped app layouts (+ `manifest.json`) |
| `rx/orgs/<org>/styles/` | The org's tokens: `base/` scales → `semantic/` + `themes/` |

The complete authoring guide is **`docs/unoverse/UNOVERSE_AUTHORING.md`** — read §1–§7
before building anything real. `UNOVERSE_LAYERS.md` covers how templates organize into
`blocks/` + `states/`, and `UNOVERSE_CONFORMANCE.md` explains how the rules are checked.

## Step 1: Open the Studio

Set `UNOVERSE_WORKBENCH=1` on the `unoverse` service in `docker-compose.yml`, restart
(`docker compose up -d unoverse`), and open http://localhost:4105. Mock mode renders
every component from its prop `default`s; the state picker walks its states.

## Step 2: Restyle an Existing Component (live)

1. Pick a component in the Studio and open its definition in `rx/components/`.
2. Change a style — e.g. a `radius`, a `color` token, a `gap`.
3. Refresh — **edits to existing components apply live**, no rebuild needed.

## Step 3: Create Your Own Component

1. Copy the closest existing component folder as your starting shape.
2. Give it an envelope (`unoverse`, `kind`, `name`, `category`, `description`,
   `whenToUse`) and declare every bound field in `props` with a `default`.
3. Build the tree from the closed vocabulary — compose, don't invent primitives.

```bash
# Then generate its workflow node and restart:
unoverse gendesign
```

Your component now appears in the Studio and as a node on the Canvas, ready for a
workflow to stream data into it.

## Step 4: Audit It

Run your definition through the conformance checklist —
`docs/unoverse/UNOVERSE_AUTHORING.md` §9. The big ones: no raw px/hex anywhere
(tokens only), every bound field has a prop with a default, workflow-fed props are
marked `input: true`, whole-view swaps use `Switch`, repeats use `Each`.

## Build with Claude Code

The starter ships an authoring skill (`.claude/skills/unoverse-create`). Open the repo
in Claude Code and ask — *"create a pricing card component"* — and it follows the
authoring rules, validation, and deploy loop for you.

## What's Next?

- [Challenge 6: Create a MCP](./06-create-a-mcp.md)
