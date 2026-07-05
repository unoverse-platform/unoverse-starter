# @unoverse-platform/miro-bridge

## 0.2.4

### Patch Changes

- meta(discoverability): outcome-first whenToUse for selection ranking

  - flow: add whenToUse to Code, Context, Field Validator, If/Else, Loop, Note, Relay, Suggestions, UMAP (previously had none); rewrite MCP Service outcome-first.
  - Service/MCP providers (openai Embedding/OpenAI Service, aws-bedrock Embedding, aws-dynamodb DynamoDB Service, pinecone Pinecone Service, slack, salesforce, miro-bridge): rewrite whenToUse outcome-first per docs-starter/nodes/14-node-discoverability.md — job/outcome first, decision rule vs the real incumbent, generic service-edge wiring fact last.
  - Attach-target wiring now generic ("an agent node") instead of enumerating specific agent node types.
  - miro-bridge: node-definition category "Agent Tools" -> "Output" (matches package.json, fixes tool-plumbing embedding pull).

## 0.2.3

### Patch Changes

- Publish all core marketplace nodes.
- Updated dependencies
  - @unoverse-platform/plugin-base@1.1.6

## 0.2.1

### Patch Changes

- bump
- d3241e6: bump

## 0.2.0

### Minor Changes

- Initial release of marketplace packages

## 0.1.3

### Patch Changes

- Add rich marketplace metadata to all packages: displayName, category, features list, node descriptions with type/MCP info, and credential requirements for the unified Package Marketplace UI

## 0.1.2

### Patch Changes

- Add node names to package metadata for enhanced marketplace display

## 0.1.1

### Patch Changes

- Initial npm publish - open source node packages for Gravity Platform
- Updated dependencies
  - @unoverse-platform/plugin-base@1.1.4
