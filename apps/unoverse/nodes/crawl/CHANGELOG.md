# @unoverse-platform/crawl

## 1.3.1

### Patch Changes

- meta(discoverability): outcome-first whenToUse + canonical categories (full sweep)

  Second-pass review of every remaining node against docs-starter/nodes/14-node-discoverability.md:

  - Rewrote whenToUse where it led with mechanism or failed to name the incumbent it loses to (aws-nova, aws-bedrock Claude/Embedding, cloudinary FileContent, crawl Apify Starter/Results, all 9 gtm lead-gen nodes, email, gce-toolkit, pdf-render, all 4 search nodes, x-search, xai-grok, openai ChatGPTAgent/OpenAIAgent, pinecone Query/Upload, flow SendObject). Strong existing meta left unchanged.
  - Normalized node-definition category to the canonical taxonomy (AI | Ingest | Storage | Output | Flow), TitleCase, and made it agree with package.json gravity.nodes[].category: aws-s3/cloudinary/aws-dynamodb casing storage->Storage; aws-toolkit Textract + aws-medical + ingest ElevenLabs ingest->AI; ingest SpatialIngest ->Storage; pinecone Knowledge->Storage; salesforce Productivity->Storage; slack Communication->Output; email + flow SendObject/Suggestions ->Output.
  - Attach-target wiring facts kept generic ("an agent node"); specific node names retained only in decision rules.

## 1.1.1

### Patch Changes

- Publish all core marketplace nodes.
- Updated dependencies
  - @unoverse-platform/plugin-base@1.1.6

## 1.1.0

### Minor Changes

- Introduce the `@unoverse-platform/crawl` package and move the web-crawling nodes out of `ingest`.

  - New `@unoverse-platform/crawl` package with HyperbrowserScrape, HyperbrowserCrawl and HyperbrowserExtract (split from the old single Hyperbrowser node), plus ApifyStarter and ApifyResults.
  - Hyperbrowser nodes now expose the full create-new-session option set: stealth, ultra-stealth, residential proxies with country targeting, CAPTCHA solving, adblock and cookie-consent handling.
  - `ingest` no longer ships the `Hyperbrowser`, `ApifyStarter` or `ApifyResults` nodes, nor the `apifyCredential`/`hyperbrowserCredential` definitions (now in `crawl`).
