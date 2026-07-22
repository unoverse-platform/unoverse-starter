---
sidebarTitle: "Testing Nodes"
title: "Testing Nodes"
---

Every code node should ship an **integration test** that exercises the node's real
behavior against the real upstream API. This is a true feature test — not a mock —
and it does **not** require the platform to be running.

## Why integration, not platform-run

A marketplace package is self-contained and sandboxed: it has no DB access and never
fetches credentials itself — **credentials are passed in per execution** (see
`docs/architecture/MARKETPLACE_ARCHITECTURE.md`). So a test does exactly what the engine
does at runtime: it calls the node's service with a credential **handed in**. The key is
the developer's own (an external publisher tests with *their* API key), supplied via a
gitignored `.env` — never the platform's stored credentials, which a package can't reach
by design.

## Layout — one test per node, co-located

Tests live in a `test/` folder inside each node, next to `node/`, `service/`, `util/`:

```
src/
  HyperbrowserExtract/
    node/  service/  util/
    test/
      HyperbrowserExtract.test.ts     ← imports ../service/...
```

Jest discovers them via `testMatch: ["**/*.test.ts"]` under `roots: ["<rootDir>/src"]`.
The package's `*.test.ts` files are excluded from the build (`tsconfig` `exclude`).

## Credentials — gitignored `.env`, passed in, skip if absent

Keys live in a per-package `.env` (gitignored). `dotenv` loads them into `process.env`;
the test passes the key into `context.credentials[<type>]` exactly as the engine delivers
it. When the platform isn't initialized, plugin-base's `getNodeCredentials` stub falls
back to `context.credentials[<type>]`, so **no running platform is needed**.

If the key is missing, the suite is **skipped, not failed** — CI without secrets stays
green; a dev with the key gets real coverage.

```typescript
// src/HyperbrowserExtract/test/HyperbrowserExtract.test.ts
import { extractFromUrls } from "../service/extractService";

const apiKey = process.env.HYPERBROWSER_API_KEY;
const ctx = {
  credentials: { hyperbrowserCredential: { apiKey } },
  nodeType: "HyperbrowserExtract",
  workflowId: "test", executionId: "test", nodeId: "extract-test",
};

(apiKey ? describe : describe.skip)("HyperbrowserExtract (integration, real API)", () => {
  it("extracts structured data from a URL", async () => {
    const result = await extractFromUrls(
      { urls: ["https://example.com"], prompt: "Return the heading as { heading }" } as any,
      ctx,
    );
    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
  });
});
```

`describe.skip` (not an early `return`) so skipped suites show as **skipped** in the
report, never as hollow passes.

## Setup — config in `package.json`, no root config files

Each package already has `jest` + `ts-jest` devDeps. Put the config in `package.json`
(keeps the package root clean — no `jest.config.js` / `jest.setup.js`), add `dotenv`:

```jsonc
// package.json
"jest": {
  "preset": "ts-jest",
  "testEnvironment": "node",
  "roots": ["<rootDir>/src"],
  "testMatch": ["**/*.test.ts"],
  "setupFiles": ["dotenv/config"],   // loads .env into process.env
  "testTimeout": 60000                // real API calls need room
},
"devDependencies": { "dotenv": "^16.4.0", "...": "..." }
```

Commit a `.env.example` listing the keys the package needs; gitignore the real `.env`:

```bash
# .env.example  (committed)
HYPERBROWSER_API_KEY=
APIFY_API_TOKEN=

# .gitignore
.env
```

## Running

```bash
# from the starter repo root (node packages live in packages/)
npm install                       # picks up dotenv
cp apps/unoverse/nodes/<pkg>/.env.example apps/unoverse/nodes/<pkg>/.env  # fill in your dev keys
npm test -w @unoverse-platform/<pkg>     # whole package
# or one node:
cd apps/unoverse/nodes/<pkg> && npx jest HyperbrowserExtract
```

## Guidelines

- **Keep fixtures small and cheap** — one URL, `maxPages: 1`, `example.com`. Real calls
  cost money and time.
- **Assert the contract, not exact content** — that a `result.markdown` string came back,
  that `result.pages` is a non-empty array — not the page's literal text.
- **Expect some flakiness from real APIs.** A real call can intermittently fail (rate
  limits, transient upstream errors). If a node is genuinely flaky, that's a finding worth
  surfacing — don't paper over it by removing the test.
- **One test per node minimum** — the happy path that proves the node actually works.
  Add error-path cases (missing required input, etc.) as plain assertions; those need no
  key and always run.
