# Migrating External Integration Packages (`.ssi`)

How to convert a third-party integration bundle — IBM-style `.ssi` connector packages, or any catalog of API operations — into a GravityAI marketplace node.

This doc has two halves:

1. **The `.ssi` source format** — what the bundle contains and how each piece maps onto a Gravity node.
2. **Design decisions** — how to collapse hundreds of operations into a tight, agent-usable node.

The reference conversion is the **Salesforce** bundle (`Salesforce_1.0.48.ssi`, 248 blocks). The `@unoverse-platform/slack` package is the canonical *output* shape to mirror.

---

## Part 1 — The `.ssi` source format

An `.ssi` "package" is a **directory** (despite the file-like extension), not an archive. Its layout:

```
Salesforce_1.0.48.ssi/
├── manifest.json                       # package metadata + block count
├── icons/
│   ├── Salesforce.svg                  # light icon
│   └── Salesforce-dark.svg             # dark icon
├── authschemas/Salesforce/
│   ├── Salesforce.json                 # basic auth schema (user/pass/token)
│   └── SalesforceOAuth.json            # OAuth2 auth schema
├── javascript/Salesforce/
│   ├── request.js                      # shared HTTP+auth helper
│   ├── authenticate.js                 # auth/token logic
│   ├── test-auth.js                    # auth-test helper
│   └── test-oauth.js
└── flows/Salesforce/
    ├── test-auth.json                  # top-level auth-test flow
    ├── test-oauth.json
    └── <Category>/<Operation>.json     # ← one file per API operation (the "blocks")
        e.g. Records/Create a Record.json
             Search/Search.json
             My Organization/Get a List of Objects.json
```

### `manifest.json`

```jsonc
{
  "manifest_version": "1.1",
  "name": "Salesforce",
  "version": "1.0.48",
  "description": "...",
  "products": ["Data 360 Connect", "Manage Passwords", "Salesforce"],
  "links": { "api": "...", "eula": "..." },
  "author": { "name": "IBM", "email": "..." },
  "changelog": { "1.0.47": "Integration improvements." },
  "includedDependencies": [],
  "blocks": 248                          // total operation count across flows/
}
```

→ Maps onto your `package.json`: `name`/`version`/`description` seed the npm fields; `icons/` → `gravity.logoUrl`; `links.api` is useful for credential `description` text and tool docs. **`blocks` is NOT your tool count** — see Part 2.

### `authschemas/*.json`

Each auth schema is a JSON Schema describing the credential fields plus an `authTestFlow` pointer:

```jsonc
// authschemas/Salesforce/Salesforce.json
{
  "serviceName": "Salesforce",
  "title": "Salesforce",
  "schema": {
    "type": "object",
    "properties": {
      "host":           { "type": "string", "title": "Host" },
      "username":       { "type": "string", "title": "Username" },
      "password":       { "type": "string", "title": "Password", "format": "password" },
      "security_token": { "type": "string", "title": "Security token", "description": "..." }
    },
    "required": ["host", "username", "password", "security_token"]
  },
  "authTestFlow": "Salesforce/Test Auth"
}
```

→ Each auth schema becomes one **Gravity credential definition** (`src/credentials/index.ts`). `properties` → credential `properties[]`; `format: "password"` and token/secret fields → `secret: true`. A bundle with two schemas (basic + OAuth) usually still ships **one** Gravity credential type — pick the auth the agent use-case actually needs (often OAuth2), and don't model both unless both are genuinely required.

### `flows/**/<Operation>.json` — the operations

This is the heart of the bundle. **Each flow file is one REST operation.** Structure:

```jsonc
// flows/Salesforce/Records/Create a Record.json
{
  "platform": "node", "language": "js", "runProcess": "main",
  "name": "Create a Record",
  "processes": [{
    "name": "main",
    "nodes": [
      { "name": "start", "nextNodes": ["process_parameters"] },
      { "name": "process_parameters",
        // sets up the HTTP call — method, endpoint template, path-param substitution, body
        "function": "this.i['r_method'] = 'POST';\n
                     this.i['r_host'] = 'Salesforce';\n
                     this.i['r_endpoint'] = '/services/data/v52.0/sobjects/{sObject}/';\n
                     this.i['r_endpoint'] = this.i['r_endpoint'].replace('{sObject}', this.i['sObject']);\n
                     if (this.i['Body'] !== undefined) this.i['r_body'] = this.i['Body'];",
        "nextNodes": ["request"] },
      { "name": "request",
        // delegates to the shared helper with auth + the assembled request
        "function": "this.moduleAwait('./Salesforce/request', null, this.i['authKey'],
                     this.i['r_method'], this.i['r_host'], this.i['r_endpoint'],
                     this.i['r_query'], this.i['r_headers'], this.i['r_body'], this.i['r_formData']);",
        "nextNodes": ["finish"] },
      { "name": "finish", "function": "this.i['result'] = this.l['request'];" }
    ]
  }],
  "variables": [
    { "name": "authKey", "isInput": true, "required": true, "meta": { "authType": "Salesforce" } },
    { "name": "sObject", "isInput": true, "required": true, ... },
    { "name": "Body",    "isInput": true, ... },
    { "name": "result",  "isOutput": true, "type": { "type": "object", "properties": { "id": {...}, "success": {...} } } }
  ]
}
```

**Everything you need to build an MCP tool is in here, no JS execution required — read it statically:**

| From the flow | Becomes |
| --- | --- |
| `process_parameters` → `r_method` + `r_endpoint` (with `{...}` path params) | The HTTP call your service makes |
| `variables[]` where `isInput: true` (minus `authKey`) | The tool's **input parameters** (drop `authKey` — credentials are injected) |
| `variables[]` where `isOutput: true` → `.type` | The tool's **output shape** |
| `meta.description` on each variable | Parameter docs for the MCP `getSchema` |
| `name` + folder (`<Category>`) | Tool grouping + naming |

The `javascript/request.js` helper is just an authenticated `fetch` wrapper — you don't port it; you re-implement the equivalent once as `src/shared/<service>Client.ts`.

---

## Part 2 — Design decisions

> A 248-block bundle does **not** become 248 tools. The single most important decision is *what to leave out*.

### Default pattern: Hybrid MCP node (Pattern C)

Most integrations should produce **one Hybrid MCP node** — a single node that exposes tools to agents via `handleServiceCall` **and** fires `__outputs` when triggered on the workflow graph. See `08-mcp-services.md` for the channel mechanics.

### Choosing MCP tools — target 6–8 per node

Collapse the bundle's operations down to **6–8 tools, never more than 10** without strong justification.

**Selection question for every operation: "Would an AI agent realistically call this in a conversation?"**

| Include | Skip |
| --- | --- |
| Actions agents take conversationally (send, search, lookup) | Admin/config operations (set icons, manage groups) |
| Read operations that inform decisions (get record, read history) | Bulk/batch operations (import CSV, stream records) |
| Common write operations (create, update) | Rare destructive ops (delete org, wipe data) |
| Operations with a clear input → output | Multi-step orchestration (OAuth exchange, upload chains) |

**Grouping heuristic:**

1. List the source operation categories (the `flows/<Category>/` folders).
2. For each: "Would an agent use this in a conversation?" — Yes/No.
3. From the Yes categories, pick the 1–2 most common operations.
4. Combine into a **flat** tool list — no nesting.
5. If a category has only rare/admin ops, skip it entirely.

> **Salesforce example:** 248 blocks across ~20 categories (Records, Search, Object Metadata, Limits, Layouts, User Passwords, Consent, Portability…) collapse to roughly: `create_record`, `update_record`, `get_record`, `search_records` (SOSL/SOQL), `list_objects`, `describe_object`. User Passwords, Consent, Portability, Layouts, Limits → skipped (admin/rare). That's 6 tools from 248 blocks.

**Tool naming:** `verb_noun`, short and unambiguous — `create_record`, `search_messages`, `get_user`, `list_channels`.

### What NOT to expose as MCP tools

- File-upload operations (multipart/form-data) → use a PromiseNode workflow step instead.
- Destructive admin operations (delete, archive, wipe).
- Auth/OAuth flows (credential concern, not an agent tool — these are the `test-auth`/`test-oauth` flows in the bundle).
- Operations returning massive paginated datasets — agents work with bounded results.
- Anything the average user would never ask an agent to do.

### When to add a separate PromiseNode alongside the MCP node

- File uploads needing multipart/form-data.
- Batch / ETL operations.
- Operations that should **always** fire in a pipeline (not agent-decided).
- Webhook / trigger receivers.

### Pagination

For MCP tools, return the **first page only** with a `has_more` flag. Don't auto-paginate inside a tool call.

---

## Part 3 — Credential pattern (MUST follow)

See `04-credentials.md` for the full spec. Migration-specific essentials below. Note: in marketplace integration nodes we **read credentials by field signature**, not via `api.getNodeCredentials()`.

### 1. Credential definition (`src/credentials/index.ts`)

```typescript
export const SalesforceCredential = {
  name: "salesforceCredential",        // camelCase — the credential TYPE identifier
  displayName: "Salesforce",
  description: "API credentials for Salesforce",
  properties: [
    {
      name: "accessToken",             // field name — used to FIND creds at runtime
      displayName: "Access Token",
      type: "string" as const,
      required: true,
      secret: true,                    // masked in UI, encrypted at rest
      description: "OAuth access token from your Salesforce connected app",
    },
    // ...host / instanceUrl etc., derived from the authschema properties
  ],
};
```

### 2. Node definition — declare the requirement

```typescript
credentials: [
  { name: "salesforceCredential", required: true },  // matches the definition .name
],
// ⚠️ No `type` field here — only { name, required }
```

### 3. Read credentials in the executor — by field signature

```typescript
private getCredentials(context: NodeExecutionContext): SalesforceCredentials {
  const available = (context as any).credentials || {};
  let creds: any;
  for (const val of Object.values(available)) {
    if ((val as any)?.accessToken) { creds = val; break; }  // find by signature, not by key
  }
  if (!creds?.accessToken) throw new Error("Salesforce credential not configured");
  return { accessToken: creds.accessToken /* , instanceUrl, ... */ };
}
// ❌ Do NOT use api.getNodeCredentials() in marketplace integration nodes.
```

### 4. Register in plugin setup

```typescript
async setup(api: GravityPluginAPI) {
  const { SalesforceCredential } = await import("./credentials");
  api.registerCredential(SalesforceCredential);
  // ...registerNode
}
```

### Critical rules

- **Find credentials by field signature** (`.accessToken`, `.apiKey`, `.token`), not by credential name.
- **Node definition `credentials[].name` must match the credential definition's `.name`.**
- **`credentials[]` on node definitions uses `{ name, required }` only** — no `type` field.

---

## Decision checklist

Before writing any code:

1. **MCP or PromiseNode-only?** Conversational API (messaging, search, lookup) → Hybrid MCP. Purely pipeline (ETL, file processing, batch) → PromiseNode.
2. **How many tools?** 6–8 for a typical integration. Never more than 10 without strong justification.
3. **How many nodes?** Usually 1 Hybrid MCP node. Add a separate PromiseNode only for ops that don't fit MCP (file uploads, batch).
4. **Auth type?** From `authschemas/` — OAuth2 refresh, API key, basic auth, or custom? Model the one the agent needs.
5. **Rate limiting?** Does the source API need client-side throttling?
6. **Pagination?** First page + `has_more` flag for MCP tools. Don't auto-paginate.

## Start lean, extend later

It's trivial to add a tool to `getSchema` + `handleServiceCall` in a patch release. It's much harder to remove one agents have learned to depend on. **Ship 6 tools, observe usage, add more if requested.**

---

**Reference output:** study the `slack` package for the exact folder layout, the `SlackMCP` service/node split, and the `gravity` field in its `package.json` (see `10-package-marketplace.md`).
