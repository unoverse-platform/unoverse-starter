---
sidebarTitle: "Agent Skills"
title: "Agent Skills"
---

The MCP spec defines an `instructions` field on the schema response — guidance on how to use the server's tools effectively. This is separate from:

- `description` — what the service IS (identity)
- Per-method `description` — what each tool DOES (reference)
- `instructions` — how to USE the tools well together (strategy)

## How it works

1. A node's `getSchema` response includes an `instructions` field
2. `discoverMCPTools()` extracts `instructions` from the schema
3. The agent node appends it to the system prompt (per MCP TypeScript SDK pattern)

## Lifecycle

- **Canvas-connected MCPs**: instructions load at session start, remain stable for the session
- **Spatially-discovered MCPs**: instructions arrive with the tools and are replaced when a fresh **Spatial** search returns a new set of MCPs. Same lifecycle as the tools themselves.

## When to include instructions

Not every node needs them. Include `instructions` when:

- The node has a **multi-step protocol** (read → hash → edit → retry)
- Tool selection depends on **context** (small edit vs. full rewrite)
- There are **anti-patterns** that waste tokens or cause failures
- Error recovery requires **specific sequences** not obvious from tool descriptions alone

If the per-tool descriptions are self-sufficient, omit `instructions`.

## Writing principles

1. **Don't duplicate tool descriptions.** Focus on cross-tool strategy, sequencing, and error recovery.
2. **Be prescriptive.** "Always X" and "Never Y" — not "Consider X when..."
3. **Include the WHY for non-obvious rules.** "Never re-read on STALE_SECTION — the error already gives you the hash" saves the agent from wasting a call.
4. **Show sequences, not just individual tools.** The value is in the choreography between tools.
5. **Keep it concise.** Under ~100 lines. This goes into the system prompt.

## Example

See the `smart-document` package (`src/SmartDocument/service/mcpSchema.ts`) — the `instructions` field demonstrates guidance for a complex node with multi-step editing protocol.

## Relationship to Skills

Skills (`readSkill`/`readSkillFile`) are a separate system — behavioural guidance discovered at runtime via **Spatial** search. The `instructions` field is part of the MCP schema and follows MCP spec conventions. They are not the same thing.
