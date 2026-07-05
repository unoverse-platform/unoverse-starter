# @gravity-platform/aws-nova

## 1.2.11

### Patch Changes

- meta(discoverability): outcome-first whenToUse + canonical categories (full sweep)

  Second-pass review of every remaining node against docs-starter/nodes/14-node-discoverability.md:

  - Rewrote whenToUse where it led with mechanism or failed to name the incumbent it loses to (aws-nova, aws-bedrock Claude/Embedding, cloudinary FileContent, crawl Apify Starter/Results, all 9 gtm lead-gen nodes, email, gce-toolkit, pdf-render, all 4 search nodes, x-search, xai-grok, openai ChatGPTAgent/OpenAIAgent, pinecone Query/Upload, flow SendObject). Strong existing meta left unchanged.
  - Normalized node-definition category to the canonical taxonomy (AI | Ingest | Storage | Output | Flow), TitleCase, and made it agree with package.json gravity.nodes[].category: aws-s3/cloudinary/aws-dynamodb casing storage->Storage; aws-toolkit Textract + aws-medical + ingest ElevenLabs ingest->AI; ingest SpatialIngest ->Storage; pinecone Knowledge->Storage; salesforce Productivity->Storage; slack Communication->Output; email + flow SendObject/Suggestions ->Output.
  - Attach-target wiring facts kept generic ("an agent node"); specific node names retained only in decision rules.

## 1.2.10

### Patch Changes

- Publish all core marketplace nodes.
- Updated dependencies
  - @gravity-platform/plugin-base@1.1.6

## 1.2.8

### Patch Changes

- bump

## 1.2.7

### Patch Changes

- Add rich marketplace metadata to all packages: displayName, category, features list, node descriptions with type/MCP info, and credential requirements for the unified Package Marketplace UI

## 1.2.6

### Patch Changes

- Add node names to package metadata for enhanced marketplace display

## 1.2.5

### Patch Changes

- Add package logos to metadata for marketplace display

## 1.2.4

### Patch Changes

- Initial npm publish - open source node packages for Gravity Platform
- Updated dependencies
  - @gravity-platform/plugin-base@1.1.4
