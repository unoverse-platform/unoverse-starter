# @gravity-platform/flow

## 1.1.11

### Patch Changes

- meta(discoverability): outcome-first whenToUse + canonical categories (full sweep)

  Second-pass review of every remaining node against docs-starter/nodes/14-node-discoverability.md:

  - Rewrote whenToUse where it led with mechanism or failed to name the incumbent it loses to (aws-nova, aws-bedrock Claude/Embedding, cloudinary FileContent, crawl Apify Starter/Results, all 9 gtm lead-gen nodes, email, gce-toolkit, pdf-render, all 4 search nodes, x-search, xai-grok, openai ChatGPTAgent/OpenAIAgent, pinecone Query/Upload, flow SendObject). Strong existing meta left unchanged.
  - Normalized node-definition category to the canonical taxonomy (AI | Ingest | Storage | Output | Flow), TitleCase, and made it agree with package.json gravity.nodes[].category: aws-s3/cloudinary/aws-dynamodb casing storage->Storage; aws-toolkit Textract + aws-medical + ingest ElevenLabs ingest->AI; ingest SpatialIngest ->Storage; pinecone Knowledge->Storage; salesforce Productivity->Storage; slack Communication->Output; email + flow SendObject/Suggestions ->Output.
  - Attach-target wiring facts kept generic ("an agent node"); specific node names retained only in decision rules.

## 1.1.10

### Patch Changes

- meta(discoverability): outcome-first whenToUse for selection ranking

  - flow: add whenToUse to Code, Context, Field Validator, If/Else, Loop, Note, Relay, Suggestions, UMAP (previously had none); rewrite MCP Service outcome-first.
  - Service/MCP providers (openai Embedding/OpenAI Service, aws-bedrock Embedding, aws-dynamodb DynamoDB Service, pinecone Pinecone Service, slack, salesforce, miro-bridge): rewrite whenToUse outcome-first per docs-starter/nodes/14-node-discoverability.md — job/outcome first, decision rule vs the real incumbent, generic service-edge wiring fact last.
  - Attach-target wiring now generic ("an agent node") instead of enumerating specific agent node types.
  - miro-bridge: node-definition category "Agent Tools" -> "Output" (matches package.json, fixes tool-plumbing embedding pull).

## 1.1.9

### Patch Changes

- Publish all core marketplace nodes.
- Updated dependencies
  - @gravity-platform/plugin-base@1.1.6

## 1.1.7

### Patch Changes

- bump

## 1.1.6

### Patch Changes

- Add rich marketplace metadata to all packages: displayName, category, features list, node descriptions with type/MCP info, and credential requirements for the unified Package Marketplace UI

## 1.1.5

### Patch Changes

- Add node names to package metadata for enhanced marketplace display

## 1.1.4

### Patch Changes

- Add package logos to metadata for marketplace display

## 1.1.3

### Patch Changes

- Initial npm publish - open source node packages for Gravity Platform
- Updated dependencies
  - @gravity-platform/plugin-base@1.1.4
