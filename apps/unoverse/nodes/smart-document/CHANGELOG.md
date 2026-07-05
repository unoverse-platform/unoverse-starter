# @gravity-platform/smart-document

## 0.2.9

### Patch Changes

- Fix renderer-flood bug: SmartDocument re-emitted the full rendered document (NODE_OUTPUT) on EVERY MCP call — including the read-only `outline`/`readSection` calls the agent makes constantly while authoring — re-firing the renderer and writing a full-document trace each time. The `MUTATING_METHODS` guard that exists for exactly this was never wired in. The re-render is now gated to mutations only; reads no longer re-render (they change nothing), eliminating the flood.

## 0.2.8

### Patch Changes

- Persist doc across runs/chats: Redis key scoped to userId + workflowId + conversationId + nodeId (was chatId-scoped, which reset on each new chat). 6h TTL unchanged.

## 0.2.7

### Patch Changes

- meta: generalize whenToUse attach-target to "an agent node" (no hard-coded agent node type list)

## 0.2.6

### Patch Changes

- Publish all core marketplace nodes.
- Updated dependencies
  - @gravity-platform/plugin-base@1.1.6

## 0.2.4

### Patch Changes

- bump
- d3241e6: bump

## 0.2.3

### Patch Changes

- Add rich marketplace metadata to all packages: displayName, category, features list, node descriptions with type/MCP info, and credential requirements for the unified Package Marketplace UI

## 0.2.2

### Patch Changes

- Add node names to package metadata for enhanced marketplace display

## 0.2.1

### Patch Changes

- Initial npm publish - open source node packages for Gravity Platform
- Updated dependencies
  - @gravity-platform/plugin-base@1.1.4
