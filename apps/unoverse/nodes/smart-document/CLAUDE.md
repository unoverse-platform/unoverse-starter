# SmartDocument — LLM-Editable Long Markdown via MCP

A Pattern C hybrid node (`08-mcp-services.md`) that exposes a long markdown document to an agent as a set of MCP tools, **and** emits standard workflow outputs so a downstream renderer (e.g. `MarkdownRenderer`) re-renders on every tool call.

Runtime: package node — runs in `node-service`. Workflow routing is bridged to `workflow-service` by the platform (`executeNodeWithRouting` from `getPlatformDependencies()`).

---

## Design stance

Long documents + LLM iterative editing have two dominant failure modes:

1. **Hallucinated addressing.** Models invent IDs, line numbers, or substrings that don't exist.
2. **Stale addressing.** After a few edits, the agent's mental model of the document drifts from reality.

Every design choice here is aimed at those two. See "Why these choices" below for the research rationale.

---

## Document model

Storage (Redis, keyed by `md:${userId}:${workflowId}:${conversationId}:${nodeId}` — persists across runs/chats, isolated per user + workflow + conversation + node instance):

```ts
type Section = {
  id: string;            // random, server-generated: "sec_" + base36; never reused, never positional
  level: 1 | 2;          // only H1/H2 are sections (see "Sectionization")
  heading: string;       // no leading #
  body: string;          // raw markdown; may contain H3+ headings freely, MUST NOT contain H1/H2
  parentId: string | null;
  order: number;         // sibling position; server-managed, never an agent input
  hash: string;          // sha256 of heading + "\n\n" + body, truncated to 12 chars
};

type Doc = {
  sections: Section[];
  version: number;       // bumped on every mutation
  updatedAt: string;
};
```

**Rendering**: `sections → markdown` is a pure function of the doc. The renderer receives the concatenated markdown on every `NODE_OUTPUT`.

**Why a flat list with parentId instead of a nested tree**: cheaper mutation, trivial serialization, easy hash computation. Tree is reconstructed on read.

### Sectionization

Only H1 and H2 headings start new sections. Everything below (H3–H6, paragraphs, lists, tables, code) is body content.

- Why: keeps outline tractable (tens of sections, not hundreds) and prompt-caches well. Agents can still edit sub-structure inside a body via `replaceInSection` or `updateSection`.
- Configurable via node config `sectionizeAt` (default `2`, allowed `1` or `2`). A workflow needing finer slicing can set `sectionizeAt: 2` — higher levels aren't supported because agent UX degrades past that.
- On parse, H3+ inside a body is preserved verbatim; the outline will *not* list them.

---

## Tool surface

Every tool response includes `version` (the doc version *after* this call). Agents can detect drift by comparing versions across calls.

All tool responses include `version` (the doc version *after* this call). Mutations may optionally include `expectedDocVersion` for callers that want whole-doc coherence guarantees.

### Read

- **`outline()`** → `{ version, sections: [{ id, level, heading, parentId, hash, wordCount }] }`
  No bodies. Cheap. This is the agent's map. Prompt-cacheable.
  Expected ceiling: ~200 sections / ~10 KB. Past that, split into multiple SmartDocument nodes. No pagination in v1.
- **`readSection(id, { includeChildren?: boolean })`** → `{ id, heading, body, hash, version, children? }`
  Single-section fetch. `includeChildren: true` inlines descendants as a markdown fragment (read-only).

### Edit (content-addressed, hash-checked)

All edits require `expectedHash` — the hash the agent last saw for that section (from `outline()` or `readSection()`). If the current hash differs, the call fails with `STALE_SECTION` and returns the new hash + body. The agent re-reads and retries.

All edits accept an optional `expectedDocVersion`. If provided and stale, the call fails with `STALE_DOC` and returns the current version. Use it when an operation depends on the overall shape of the doc (e.g. sibling positions, references across sections). Omit it for isolated section edits — per-section `expectedHash` is sufficient.

- **`updateSection(id, expectedHash, { heading?, body? }, expectedDocVersion?)`**
  Replaces heading and/or body. Server rejects bodies containing H1/H2 (would corrupt outline).
  Use when the change covers most of the section; use `replaceInSection` for small edits on long sections (cheaper in tokens).
- **`appendToSection(id, expectedHash, text, expectedDocVersion?)`**
  Appends to body. Common pattern (adding a bullet, a paragraph). Saves a read-modify-write round trip.
- **`replaceInSection(id, expectedHash, old_str, new_str, expectedDocVersion?)`**
  Substring replace *within one section*. `old_str` must match exactly once in `body`. Grounded in actual content — agent cannot hallucinate text that isn't there. Prefer this over `updateSection` when the change is ≤ ~20% of the section body.
- **`insertSection({ afterId | beforeId | parentId }, { level, heading, body }, expectedDocVersion?)`** → `{ id, hash, version }`
  Exactly one placement key required. New ID is generated server-side.
- **`deleteSection(id, expectedHash, { cascade?: boolean }, expectedDocVersion?)`**
  `cascade: true` removes descendants; otherwise descendants reparent to the deleted section's parent.
- **`moveSection(id, expectedHash, { afterId | beforeId | parentId }, expectedDocVersion?)`**
  Restructure without touching content.

### Bulk (escape hatch)

- **`replaceDoc(sections)`** → full replace. For "start over" or programmatic generation. Rare; tool description should discourage it.
- **`resetDoc()`** → re-parse `initialMarkdown` from node config, assigning fresh IDs. Destructive. Exposed for dev/maintenance only; prompt the agent strongly against using it.

### Preflight

- **`dryRun(method, params)`** → returns the diff that `method(params)` *would* produce, without applying it. Agent can verify intent before committing. Inspired by Anthropic's filesystem server.

---

## Invariants enforced by the server

- **IDs are stable.** Insert/delete/move never reuses or renames an ID. IDs are always random, server-generated — never derived from content or position.
- **`expectedHash` is mandatory on every mutation.** No optimistic concurrency bypass. Stale edit → `STALE_SECTION` with fresh state.
- **`expectedDocVersion` is optional on every mutation.** When provided and stale → `STALE_DOC` with fresh version.
- **Bodies may not contain H1 or H2.** Enforced on parse and on every mutation. H3–H6 is allowed inside bodies.
- **`order` is never an agent input.** Ordering is derived from placement keys (`afterId` / `beforeId` / `parentId`).
- **Every mutation bumps `version` and updates `updatedAt`.**
- **Every mutation emits `NODE_OUTPUT` with the full rendered markdown** so the renderer re-fires. This is the hybrid contract; don't skip it for any method.

## Concurrency

Writes to a single doc key are serialized via Redis `WATCH` / `MULTI` (same pattern as the current `patchDoc`). On conflict, the server retries the mutation up to 5 times transparently; past that the call returns `CONCURRENT_UPDATE`.

Concurrent callers are serialized, not rejected. There is no per-conversation lock; the Redis transaction is the only synchronization primitive.

---

## Error shape

Errors are structured and actionable:

```json
{ "ok": false, "error": "STALE_SECTION",
  "currentHash": "abc123...", "currentBody": "...",
  "hint": "Section changed since you read it. Use currentBody and currentHash and retry." }
```

Error codes: `STALE_SECTION`, `STALE_DOC`, `CONCURRENT_UPDATE`, `NOT_FOUND`, `NOT_UNIQUE` (replaceInSection matched >1), `INVALID_STRUCTURE` (body contained H1/H2), `INVALID_PLACEMENT` (bad parent/sibling ref), `INVALID_PARAMS`.

No bare string errors. Every error names a recovery action in `hint`.

---

## Initial content

`initialMarkdown` (config) is parsed into sections **once** on first `initDoc`. Parser: `unified` + `remark-parse` with `{ position: true }`.

- Only H1/H2 start new sections (see Sectionization). Everything else becomes body content of the enclosing section.
- Content before the first H1/H2 becomes the body of an implicit section with an empty heading (or is rejected — decide in implementation; recommended: rejected, agent-authored docs should always start with a heading).
- IDs are assigned **randomly** on init. Re-inits (via `resetDoc()`) generate fresh IDs; nothing in the system depends on ID stability across re-inits.

Re-parsing a changed config does **not** reset the doc. Use `resetDoc()` explicitly if you want the config's new `initialMarkdown` to take effect.

---

## Parser & serializer

- **Parse**: `unified().use(remarkParse, { position: true })`.
- **Serialize**: `unified().use(remarkStringify, { bullet: "-", fences: true, incrementListMarker: false })`.
- **Round-trip fidelity**: remark is CommonMark-compliant but not byte-perfect. Document your expected normalization (trailing newlines, list markers, link refs). If users bring in hand-formatted markdown, run it through the serializer once on import so later diffs are stable.
- **Do not** re-parse the whole doc on every edit. Mutations operate on the in-memory section array; serialize only when rendering output or returning `readSection`.

---

## Prompt caching strategy

- `outline()` is designed to be stable and prompt-cacheable. Keep the schema flat and the field order consistent so providers' cache hits are maximised.
- `readSection` responses are small and not worth caching.
- If the agent repeatedly reads the same large section, that's a prompt you should tune — not a tool to change.

---

## Agent-facing tool descriptions (drafting guide)

Every tool description should include:
1. **What it does** in one sentence.
2. **When to use it** (vs. other tools).
3. **Failure cases it will return** (so the agent can recover without human intervention).
4. **Example** parameter and response.

Specifically the edit tools must say:
> "Always call `outline()` or `readSection()` first to obtain the current `hash`. If this call returns `STALE_SECTION`, use the fresh `currentHash` and `currentBody` from the error and retry. Do not invent IDs or hashes."

---

## Anti-patterns (do not add these)

- **Line-number addressing.** Line numbers drift on every edit. Forbidden.
- **Positional `index` parameters.** (e.g. `insertAt(5)`) — positions shift; use `afterId` / `beforeId`.
- **ID-only edits without content validation.** Agent will hallucinate an ID and silently overwrite the wrong section. Always require `expectedHash` on mutations.
- **Returning line-numbered content by default.** If a `view` returns line numbers, the agent will paste them into `old_str` and `replaceInSection` will fail. Raw body only.
- **Silent best-match.** If `replaceInSection` matches 3 places, fail with `NOT_UNIQUE` — do not pick one.
- **Streaming the whole doc back as the agent's reply.** Long docs blow the context window every turn. Edits go through tools; the doc is server state.

---

## Hybrid wiring (platform contract)

`handleServiceCall` for every MCP method:
1. Run the method locally against the in-memory doc.
2. Persist to Redis (with TTL).
3. Call `executeNodeWithRouting` (from `getPlatformDependencies()`) so the node emits `NODE_OUTPUT` with the rendered markdown.
4. Return the MCP response to the agent.

`executeNode` (graph-triggered, same module) renders the current doc state — used when upstream nodes trigger a "refresh" of the renderer without the agent acting.

---

## Why these choices (research rationale)

Brief notes on where each invariant comes from:

- **Content-addressed edits with `expectedHash`**: Anthropic's filesystem `edit_file` uses substring matching so edits ground to real content; Google Docs / Notion use content hashes for optimistic concurrency. We combine both: hash detects staleness, substring matching (`replaceInSection`) prevents hallucination.
- **Stable, server-generated IDs**: Notion Blocks API and Linear's graph API both use opaque IDs, never positional. Their lesson: position is transient; identity must be immutable.
- **Flat section list with parentId**: keeps mutation cheap and avoids deep tree copies. Notion uses the same shape.
- **`dryRun` preflight**: Anthropic's filesystem server documents this as the single most impactful safety feature for LLM edit tools.
- **Rejecting line-numbered output by default**: observed failure mode in the current text-editor-style tools — the agent pastes line-numbered content into `old_str` and every edit fails.
- **Refusing headings inside bodies of higher-level sections**: without this, an `updateSection` can inject headings that the outline doesn't know about, silently diverging the outline and the rendered doc.
- **Every mutation emits `NODE_OUTPUT`**: required by the Pattern C hybrid contract so downstream renderers re-fire. This is the entire reason the node exists as a hybrid.

---

## Future work (not in v1)

- **Renderer-side diff hint.** Emit `{ markdown, changedSectionId }` on `NODE_OUTPUT` so the renderer can highlight/animate just the changed region instead of re-rendering the whole doc. Currently the renderer always gets the full markdown.
- **Undo / revert.** Not needed for v1 — the agent is the writer and can edit to recover. Reconsider if production usage shows a real need.
- **Pagination of `outline()`** past ~200 sections. Current guidance: split into multiple SmartDocument nodes.
- **Search.** Full-text search across bodies was considered and dropped. Agents can find sections via `outline()`; if docs grow past that, revisit with real requirements.

## Migration from the existing implementation

Current Redis key shape: `{ content: string, version, updatedAt }`. Target: `{ sections: Section[], version, updatedAt }`.

**Approach**: lazy migration on first access.
- On read (`outline` / `readSection`), if the stored shape is the legacy `{ content }`, parse it into sections with fresh IDs, write the new shape back under the same key, and serve the request from the new shape.
- Legacy tools (`view` / `create` / `str_replace` / `insert`) are removed on the same release — no dual surface. Old workflows that call them will receive `UNKNOWN_METHOD` and must be updated.
- No data loss: the legacy `content` string is fully preserved as the concatenation of the parsed sections.

## Current state (2026-04-30)

- Current implementation is the text-editor-style `view` / `create` / `str_replace` / `insert` toolset, storing one markdown blob. Known pain: long-doc edits fail, agent drifts, renderer occasionally misses updates.
- This document is the **target design** to migrate toward. Do not add new features to the old toolset; any new work moves us toward the section model above.
