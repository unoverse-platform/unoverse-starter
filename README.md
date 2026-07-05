# Unoverse Starter

Your workspace for building on the **Unoverse platform** — a self-hosted AI
platform where you compose agent-powered apps out of three kinds of things:

- **Workflows** — built visually on the **Canvas**, wiring nodes into agents,
  tools, and data flows
- **UI as data** — components and templates written as JSON definitions
  (no React, no CSS), rendered live by the platform's SDK
- **Behavior** — agent skills and prompt blocks in plain markdown

The platform services run as Docker images; **you edit only the three folders
under `apps/unoverse/`** (see [What you build](#what-you-build)) and they are
mounted straight into the running platform.

## Prerequisites

- **Docker** + Docker Compose
- **Node.js 20+** and npm (for building custom nodes)
- A **read-only registry token** from your platform admin (for pulling the
  platform's Docker images)
- A **Postgres** database, **Redis**, and an **Auth0 (OIDC)** app — all
  configured in `.env` (`.env.example` documents every variable)

## Quick start

```bash
./unoverse init        # setup wizard: env config + registry login + image pull
./unoverse start       # start the platform
./unoverse db-setup    # apply database migrations
./unoverse check       # verify: services, health, node catalog, bundles
npm install            # dev dependencies (for building custom nodes)
```

Then open:

| Surface | URL | |
|---|---|---|
| **Canvas** — visual workflow builder | http://localhost:3001 | |
| **API** — the platform's public listener | http://localhost:4105 | |
| **Studio** — preview components, templates, skills, nodes | http://localhost:4105 | set `UNOVERSE_WORKBENCH=1` on the `unoverse` service first |
| **Logs** (Dozzle, live container logs) | http://localhost:8080 | `docker compose --profile observability up -d dozzle` |

## New here? Follow the onboarding

**[`docs/onboarding/`](docs/onboarding/README.md)** walks you from zero to
shipped, in order: getting started → your first agent → your first node →
ingesting content → components & templates → MCPs → a client app → deployment.
Start at [`01-getting-started.md`](docs/onboarding/01-getting-started.md).

## What you build

Three developer-editable folders are mounted into the running platform:

| Folder | What it is | To see changes live |
|--------|------------|---------------------|
| `apps/unoverse/rx/`      | **Design** — components, atoms, org templates + styles (JSON definitions) | `./unoverse gendesign` (restyles of existing components apply live) |
| `apps/unoverse/prompts/` | **Behavior** — agent skills (`skills/`) + prompt blocks (`blocks/`) | `docker compose restart unoverse` |
| `apps/unoverse/nodes/`   | **Logic** — custom workflow node packages (TypeScript) | `./unoverse build @unoverse-platform/<pkg>` |

### Build with Claude Code

This repo ships an authoring skill at `.claude/skills/unoverse-create`. Open the
repo in [Claude Code](https://claude.com/claude-code) and ask for what you want —
*"create a pricing card component"*, *"add a node that calls our inventory
API"*, *"write a returns-handling skill"* — and it follows the platform's
authoring rules, validation, and deploy loop for you.

### Docs map

| Read | For |
|---|---|
| [`docs/onboarding/`](docs/onboarding/README.md) | guided path through your first agent, node, component, and deploy |
| [`docs/nodes/`](docs/nodes/README.md) | complete node development guide (types, patterns, credentials, testing) |
| `docs/unoverse/` | UI authoring: components & templates ([AUTHORING](docs/unoverse/UNOVERSE_AUTHORING.md)), state ([STATE_MODEL](docs/unoverse/UNOVERSE_STATE_MODEL.md)), layers, conformance |
| [`docs/runbooks/`](docs/runbooks/README.md) | operations: database, hardening, HTTPS, observability, restarts |

## Platform commands

| Command | Purpose |
|---------|---------|
| `unoverse init` | Interactive setup wizard |
| `unoverse start` / `unoverse stop` | Start / stop the platform |
| `unoverse status` | Show service health |
| `unoverse check` | Health check: services, endpoints, node catalog, bundles |
| `unoverse logs [service]` | Stream logs |
| `unoverse build [pkg]` | Build node packages + restart (all, or one) |
| `unoverse gendesign` | Regenerate component nodes from `rx/` + restart |
| `unoverse update` | Full update: git sync + pull images + rebuild + restart |
| `unoverse doctor` | Diagnose issues |
| `unoverse db-setup` | Apply database migrations |

## Something wrong?

1. `./unoverse doctor` then `./unoverse check`
2. `./unoverse logs unoverse` (or Dozzle) for errors
3. Node built but not appearing? The catalog loads at boot —
   `docker compose restart unoverse`
4. Still stuck: `docs/nodes/05-troubleshooting.md` and `docs/runbooks/`

## Production

Deploy to a server with the `ansible/` playbooks and `docs/runbooks/`
(HTTPS via Caddy, hardening, observability). Update a running server with
`./unoverse update`. See [`docs/onboarding/08-deployment.md`](docs/onboarding/08-deployment.md).
