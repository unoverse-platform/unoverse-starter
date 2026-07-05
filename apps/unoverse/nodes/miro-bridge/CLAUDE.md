# MiroBridge — LLM-to-Miro Board via MCP

A Pattern C hybrid node (`08-mcp-services.md`) that gives an LLM agent a full read/write interface to a live Miro board via 15 MCP tools. The board is the source of truth — no sync problem, no separate state layer. The server node manages a Redis cache of board state; the browser component (running inside the Miro iframe) executes all Miro SDK calls.

Runtime: package node — runs in `node-service`. The Miro Web SDK (`window.miro.board.*`) is browser-only. The server node is a relay and state cache.

---

## Architecture

```
LLM node
  └─ MCP tool call (e.g. create_sticky)
       └─ MiroBridgeExecutor.handleServiceCall()
            └─ mcpHandlers
                 ├─ READS (get_board_state, get_selection):
                 │    registers pending promise → websocket.send(OBJECT_DATA { requestId })
                 │    → gravity-client → zustand → MiroBridge component props
                 │    → window.miro.board.get() / getSelection()
                 │    → sendUserAction({ action: "miro_tool_result", data: { requestId, result } })
                 │    → handleUserAction() → resolvePendingRequest() → returns to LLM
                 │    (get_board_state also saves snapshot to Redis)
                 │
                 └─ WRITES (create_*, update_item, delete_item, etc.):
                      update Redis immediately → fireCommand() (fire-and-forget OBJECT_DATA)
                      → component executes window.miro.board.* → returns id to LLM instantly
```

**Board is the source of truth.** `get_board_state` fetches the live board from the iframe — user edits are automatically included. Writes update Redis then fire to the browser with no wait. The LLM re-calls `get_board_state` whenever it needs a fresh view, same pattern as SmartDocument's `outline()`.

**Dispatch mechanism**: `OBJECT_DATA` WebSocket message (same as `SendObject` node). Lands in zustand under `chatId_nodeId`; `withZustandData` HOC injects it as props to the browser component.

After every write, `executeNodeWithRouting` re-fires `executeNode` to emit updated `boardState` as `NODE_OUTPUT` to downstream nodes.

---

## Package structure

```
miro-bridge/
├── src/
│   ├── index.ts                          — createPlugin({ setup }) registers MiroBridgeNode
│   └── MiroBridge/
│       ├── node/
│       │   ├── index.ts                  — createNodeDefinition() + MiroBridgeNode export
│       │   └── executor.ts               — PromiseNode hybrid: executeNode + handleServiceCall + handleUserAction
│       ├── service/
│       │   ├── mcpSchema.ts              — 15 tool descriptions and I/O schemas
│       │   ├── mcpHandlers.ts            — per-tool handlers: reads (async), writes (fire-and-forget + Redis)
│       │   └── boardStore.ts             — Redis CRUD: getBoard / saveBoard / applyCreate / applyUpdate / applyDelete
│       └── util/
│           └── types.ts                  — MiroBridgeConfig, BoardState, BoardItem, MiroToolResult
└── package.json                          — @gravity-platform/miro-bridge
```

---

## Node type: PromiseNode Hybrid (Pattern C)

| Channel | Method | Behaviour |
|---------|--------|-----------|
| MCP | `handleServiceCall` | Routes tool calls; reads await iframe; writes return immediately |
| Workflow | `executeNode` | Returns cached Redis board state as `{ __outputs: { boardState } }` |
| Return path | `handleUserAction` | Resolves pending read promises when iframe sends `miro_tool_result` |

---

## MCP tools

### Reads (async round-trip to iframe)

| Tool | Description |
|------|-------------|
| `get_board_state` | Full live snapshot: all items + connectors + tags. Saves to Redis. Call first in any session, and after user may have edited the board. |
| `get_selection` | Items currently selected by the user — useful for acting on what the user is pointing at. |

### Writes (Redis update + fire-and-forget to iframe)

| Tool | Description |
|------|-------------|
| `create_sticky` | Sticky note: text, color, width. Auto-grids in 3-column 220px pitch. |
| `create_text` | Text item: text, fontSize. Auto-stacked vertically. |
| `create_frame` | Named container. Auto-positions horizontally with content-aware gaps. Optional width/height (default 1600×900). |
| `create_shape` | Shape with optional label: shape type (includes flow_chart_process/decision/terminator/database), text, x, y, width, height, fillColor |
| `create_card` | Task card: title, description, dueDate (ISO). Auto-grids. |
| `create_app_card` | Structured app card: title, description, status, up to 20 custom fields. Auto-grids. |
| `create_image` | Image from URL: url, width. Auto-grids. |
| `create_diagram` | Flowchart from Mermaid DSL. Handles all layout, sizing, shapes, and connectors automatically. Creates auto-sized frame unless parentId supplied. Max 50 nodes. |
| `update_item` | Update any item by id: content, x, y, width, height, style. Returns NOT_FOUND if id not in Redis — call get_board_state to refresh. |
| `delete_item` | Delete item by id. Returns NOT_FOUND if id not in Redis. |
| `create_connector` | Arrow between two item ids. Optional: label, shape (straight/elbowed/curved), startCap, endCap (none/arrow/filled_arrow/circle/filled_circle). |
| `add_tag` | Create a tag with title + color and attach it to an item |
| `zoom_to` | Zoom viewport to fit a set of item ids |

All writes return `{ ok: true, id: "..." }` immediately. The `id` is server-generated and stored in Redis — the LLM can use it in subsequent `update_item`, `delete_item`, `create_connector`, `zoom_to` calls without waiting for a board refresh.

Read-only tools (`get_board_state`, `get_selection`) do not trigger `executeNodeWithRouting`. All writes do.

---

## Board state model (Redis)

Key: `miro:{chatId}:{nodeId}` — TTL 24h.

```ts
type BoardState = {
  items: BoardItem[];   // all item types: sticky, text, frame, shape, card, app_card, image, connector, tag
  version: number;      // bumped on every write
  updatedAt: string;
};

type BoardItem = {
  id: string;           // server-generated: "sticky_<uuid>", "frame_<uuid>", etc.
  type: string;         // sticky_note | text | frame | shape | card | app_card | image | connector | tag
  content?: string;     // text content or URL
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  style?: Record<string, any>;  // type-specific: fillColor, shape, fields[], etc.
};
```

`get_board_state` fetches the live board from the iframe and **overwrites** Redis with the real state. This is the re-sync point — it picks up any user edits. All other reads use the cached Redis state.

---

## Async read round-trip

`requestFromComponent` in `mcpHandlers.ts`:
1. Generates `requestId` (`randomUUID()`).
2. Registers `{ resolve, reject, timer }` in the module-level `pendingRequests` Map — **20-second timeout**.
3. Sends `OBJECT_DATA { command, params, requestId }` via WebSocket.
4. Returns a `Promise` resolved by `resolvePendingRequest()`.

`resolvePendingRequest` is called by `handleUserAction("miro_tool_result", data)` in the executor.

---

## MiroBridge browser component (separate repo)

Lives in the design-system/component library. Streamed as invisible `COMPONENT_INIT`. Wrapped with `withZustandData` — receives commands as props via zustand.

**Key implementation note**: use `useEffect` keyed on `requestId` to fire each command. This guards against duplicate execution on unrelated re-renders.

Command → Miro SDK mapping:

| Command | Miro SDK call |
|---------|--------------|
| `get_board_state` | `miro.board.get()` + `board.getAllConnectors()` + `board.getAllTags()` |
| `get_selection` | `miro.board.getSelection()` |
| `create_sticky` | `miro.board.createStickyNoteItem({ content, x, y, style: { fillColor } })` |
| `create_text` | `miro.board.createTextItem({ content, x, y })` |
| `create_frame` | `miro.board.createFrame({ title, x, y, width, height })` |
| `create_shape` | `miro.board.createShapeItem({ shape, content, x, y, width, height, style })` |
| `create_card` | `miro.board.createCardItem({ title, description, dueDate, x, y })` |
| `create_app_card` | `miro.board.createAppCardItem({ title, description, status, fields[], x, y })` |
| `create_image` | `miro.board.createImageItem({ url, x, y, width })` |
| `update_item` | `miro.board.getById(id)` → `.update(changes)` |
| `delete_item` | `miro.board.getById(id)` → `.remove()` |
| `create_connector` | `miro.board.createConnector({ startItem: { id }, endItem: { id }, captions: [{ content }] })` |
| `add_tag` | `miro.board.createTag({ title, fillColor })` → `item.addTag(tag)` |
| `zoom_to` | `miro.board.viewport.zoomTo(items)` |

For `get_board_state`, the component sends back the full graph:
```ts
sendUserAction({
  action: "miro_tool_result",
  data: {
    requestId,
    result: {
      items: [...],       // all board items
      connectors: [...],  // all connectors with captions
      tags: [...],        // all tags with their item associations
    }
  }
})
```

---

## Why App Cards matter

App Cards are the richest structured-data primitive on a Miro board. Up to 20 custom typed fields per card, each with: `value`, `fillColor`, `textColor`, `iconUrl`, `iconShape`, `tooltip`. Readable by both users and the API. Use them when the LLM is outputting structured analysis (e.g. research findings, task breakdowns, scored items) — not just sticky notes.

App cards also have a `status` field (connected / disconnected / disabled) and an `owned` flag, which can represent whether the Gravity AI workflow "owns" the card.

---

## Why the full graph matters (connectors + tags)

Connectors between items encode directed relationships with labeled captions — the board becomes a lightweight knowledge graph. `get_board_state` returning the full connector list lets the LLM reason about relationships, not just items in isolation.

Tags give the LLM a categorisation layer that doesn't modify item content. Colour-coded, attachable to any sticky note. Useful for status, priority, theme clustering.

---

## Error shape

```json
{ "ok": false, "error": "MISSING_PARAM", "hint": "'text' is required for create_sticky" }
{ "ok": false, "error": "NOT_FOUND", "hint": "No item with id 'x' in board state. Call get_board_state to refresh." }
{ "ok": false, "error": "EXECUTION_ERROR", "hint": "MiroBridge timeout: 'get_board_state' did not respond within 20000ms" }
{ "ok": false, "error": "UNKNOWN_METHOD", "hint": "Unknown method 'foo'. Available: get_board_state, ..." }
```

---

## Config schema

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `defaultX` | number | 0 | Canvas X when a create tool omits `x` |
| `defaultY` | number | 0 | Canvas Y when a create tool omits `y` |

No credentials — Miro SDK auth comes from the app session (iframe has board access from app manifest scopes).

---

## Building and testing

```bash
npm run build     # tsc → dist/
npm run dev       # tsc --watch
```

```bash
curl -X POST http://localhost:4000/api/debug/execute-node \
  -H "Content-Type: application/json" \
  -d '{"nodeType":"MiroBridge","config":{},"inputs":{"trigger":"test"}}'
```

Without a live Miro iframe, `executeNode` returns the cached Redis state (empty on first run). Full end-to-end testing requires the Miro panel to be open.

---

## Anti-patterns

- **Do not call `window.miro.board.*` server-side.** Browser-only. All board ops go through the component.
- **Do not skip `executeNodeWithRouting` on writes.** Downstream nodes must re-fire with fresh board state.
- **Do not reuse `requestId`s.** Every `requestFromComponent` call generates a fresh UUID.
- **Do not treat Redis as the source of truth for reads.** Always use `get_board_state` to re-sync before making decisions that depend on current board content. Redis is a write cache, not a replica.
- **Do not create sticky notes when app cards are more appropriate.** If the data is structured, use `create_app_card`.

---

## Known limitations (v1)

- `pendingRequests` Map is in-process memory. Node-service restart mid-read loses the promise — LLM receives a timeout. Redis-backed pending table would fix this.
- `zoom_to` is fire-and-forget — no confirmation the viewport moved (Miro SDK constraint).
- App card `fields[]` are write-only for now — `get_board_state` returns them but the LLM cannot update individual fields via `update_item` without replacing the full array.
- Tags can only be attached to sticky notes via the Web SDK (REST API supports attaching to more item types, but that path is not wired yet).
