# CLAUDE.md — Starter Kit Packages

## Purpose

Packages in this directory are **starter kit** — they ship with every deployment and are loaded from the local filesystem on boot. They are NOT published to npm.

## What belongs here

- `design-system` — UI component nodes (generated via gen:nodes)
- `plugin-base` — base classes (PromiseNode, CallbackNode) used by all packages
- `prompt-blocks` — reusable prompt snippets
- `skills` — skill library for agents

## What does NOT belong here

Packages that are published to npm and installed via the marketplace UI belong in `/packages-marketplace`. If you're building a new integration (AWS, Slack, OpenAI, etc.), put it there.

## How these are loaded

The node-service auto-discovers packages from this directory on startup:
1. Scans for directories with a valid `package.json`
2. Filters for `@gravity-platform/` scoped packages with `main` or `exports`
3. Calls `plugin.setup(api)` to register nodes
4. Stores metadata in Redis for the UI

The discovery path is configured via `PACKAGES_PATH` env var (defaults to `../../../packages` relative to node-service).

## Rules

1. All packages here must have `"private": true` or be in the changeset ignore list — they must never be published to npm
2. These packages are part of the root npm workspace (`packages/*` in root `package.json`)
3. They are built by turbo as part of `npm run build`
