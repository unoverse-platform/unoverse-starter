# @unoverse-platform/ingest

## 4.1.0

### Minor Changes

- ElevenLabs moves out of `ingest` into its own `@unoverse-platform/elevenlabs` package, and gains three new nodes.

  - **ElevenLabs TTS** — generalized to any voice via `voiceId` + model/format selection. Keeps a backward-compatible path: labelled `[DETECTIVE]:/[SUSPECT]:/[NARRATOR]:` scripts still route through the original voice-pool dialogue behavior (node type `ElevenLabs` and credential type `elevenlabsCredential` unchanged, so existing workflows keep working).
  - **ElevenLabs Dialogue** — multi-speaker scripts with explicit per-line voices via `/v1/text-to-dialogue`.
  - **ElevenLabs Sound Effects** — text prompt → sound effect clip via `/v1/sound-generation`.
  - **ElevenLabs Speech to Text** — audio/video → transcript via `/v1/speech-to-text` (Scribe), with optional diarization and word timings.
  - **ElevenLabs Music** — text prompt → original composed music track via `/v1/music`.

  `ingest` no longer registers the ElevenLabs node or credential.

## 4.0.1

### Patch Changes

- meta(discoverability): outcome-first whenToUse + canonical categories (full sweep)

  Second-pass review of every remaining node against docs-starter/nodes/14-node-discoverability.md:

  - Rewrote whenToUse where it led with mechanism or failed to name the incumbent it loses to (aws-nova, aws-bedrock Claude/Embedding, cloudinary FileContent, crawl Apify Starter/Results, all 9 gtm lead-gen nodes, email, gce-toolkit, pdf-render, all 4 search nodes, x-search, xai-grok, openai ChatGPTAgent/OpenAIAgent, pinecone Query/Upload, flow SendObject). Strong existing meta left unchanged.
  - Normalized node-definition category to the canonical taxonomy (AI | Ingest | Storage | Output | Flow), TitleCase, and made it agree with package.json gravity.nodes[].category: aws-s3/cloudinary/aws-dynamodb casing storage->Storage; aws-toolkit Textract + aws-medical + ingest ElevenLabs ingest->AI; ingest SpatialIngest ->Storage; pinecone Knowledge->Storage; salesforce Productivity->Storage; slack Communication->Output; email + flow SendObject/Suggestions ->Output.
  - Attach-target wiring facts kept generic ("an agent node"); specific node names retained only in decision rules.

## 3.0.0

### Major Changes

- Introduce the `@unoverse-platform/crawl` package and move the web-crawling nodes out of `ingest`.

  - New `@unoverse-platform/crawl` package with HyperbrowserScrape, HyperbrowserCrawl and HyperbrowserExtract (split from the old single Hyperbrowser node), plus ApifyStarter and ApifyResults.
  - Hyperbrowser nodes now expose the full create-new-session option set: stealth, ultra-stealth, residential proxies with country targeting, CAPTCHA solving, adblock and cookie-consent handling.
  - `ingest` no longer ships the `Hyperbrowser`, `ApifyStarter` or `ApifyResults` nodes, nor the `apifyCredential`/`hyperbrowserCredential` definitions (now in `crawl`).

## 1.1.6

### Patch Changes

- bump

## 1.1.5

### Patch Changes

- Add rich marketplace metadata to all packages: displayName, category, features list, node descriptions with type/MCP info, and credential requirements for the unified Package Marketplace UI

## 1.1.4

### Patch Changes

- Add node names to package metadata for enhanced marketplace display

## 1.1.3

### Patch Changes

- Add package logos to metadata for marketplace display

## 1.1.2

### Patch Changes

- Initial npm publish - open source node packages for Gravity Platform
- Updated dependencies
  - @unoverse-platform/plugin-base@1.1.4
