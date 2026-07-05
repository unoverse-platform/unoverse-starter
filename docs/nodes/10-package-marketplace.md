# Package Marketplace Schema

This document defines the ideal `gravity` field schema for `package.json` that powers the unified Package Marketplace in Canvas.

## The `gravity` field in package.json

Every publishable Gravity package must include a `gravity` field with marketplace metadata. This is what the marketplace UI reads to display packages with rich detail.

```jsonc
{
  "name": "@unoverse-platform/openai",
  "version": "1.1.9",
  "description": "OpenAI integration for Gravity workflow system",
  "keywords": ["gravity", "openai", "workflow", "gpt", "embeddings", "ai"],
  // ... standard npm fields ...

  "gravity": {
    // REQUIRED — Display & discovery
    "displayName": "OpenAI",
    "category": "ai",
    "logoUrl": "https://res.cloudinary.com/sonik/image/upload/v.../ChatGPT-Logo.svg.webp",

    // REQUIRED — Node manifest
    "nodes": [
      {
        "name": "ChatGPT Agent",
        "type": "PromiseNode",
        "description": "Conversational AI agent with tool use and memory",
        "category": "AI",
        "mcp": false
      },
      {
        "name": "OpenAI Stream",
        "type": "CallbackNode",
        "description": "Streaming token-by-token response from GPT models",
        "category": "AI",
        "mcp": false
      },
      {
        "name": "Embedding Service",
        "type": "PromiseNode",
        "description": "Generate text embeddings via OpenAI ada/text-embedding-3",
        "category": "AI",
        "mcp": true
      }
    ],

    // REQUIRED — Features list (shown as chips/badges in marketplace)
    "features": [
      "GPT-4o & GPT-5 support",
      "Streaming responses",
      "Function/tool calling",
      "Text embeddings",
      "Structured output (JSON mode)",
      "Vision (image inputs)"
    ],

    // OPTIONAL — Rich detail
    "screenshots": [
      "https://res.cloudinary.com/sonik/image/upload/v.../openai-workflow-example.webp"
    ],
    "documentation": "https://docs.gravityai.dev/packages/openai",
    "changelog": "https://github.com/unoverse-platform/packages/blob/main/packages/openai/CHANGELOG.md",

    // OPTIONAL — Credential requirements (what the user needs to configure)
    "credentials": [
      {
        "name": "OpenAI API Key",
        "type": "openaiApiKey",
        "required": true,
        "description": "API key from platform.openai.com"
      }
    ],

    // OPTIONAL — Compatibility & requirements
    "requires": {
      "nodeService": ">=1.0.0",
      "pluginBase": ">=1.0.0"
    },

    // OPTIONAL — Author & support
    "author": {
      "name": "Gravity Team",
      "url": "https://gravityai.dev"
    },
    "support": "https://github.com/unoverse-platform/packages/issues"
  }
}
```

## Category taxonomy

Packages must declare exactly one primary `category`:

| Category | Slug | Description |
|----------|------|-------------|
| AI & LLMs | `ai` | Language models, embeddings, agents, structured output |
| Data & Storage | `storage` | Databases, file storage, caching |
| Ingest & Scraping | `ingest` | Web scraping, document parsing, data extraction |
| Communication | `communication` | Email, messaging, notifications |
| Cloud Services | `cloud` | AWS, GCP, Azure service wrappers |
| Flow Control | `flow` | Loops, conditionals, routing, code execution |
| Media & Design | `media` | Image processing, PDF, video, design tools |
| Search & Discovery | `search` | Web search, vector search, social media |
| Productivity | `productivity` | Spreadsheets, project management, CRM |

## Node object schema

Each entry in `gravity.nodes[]` is now an object (not a plain string):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Display name shown in node palette |
| `type` | `"PromiseNode"` \| `"CallbackNode"` | yes | Execution model |
| `description` | string | yes | One-line description of what this node does |
| `category` | string | yes | Node category in the canvas palette |
| `mcp` | boolean | no | Whether this node exposes MCP service tools |

## Features list guidelines

The `features` array should contain 3–8 short strings (under 40 chars each) that describe the package's key capabilities. These are displayed as chips in the marketplace card and detail view. Focus on what a user can DO with the package, not implementation details.

Good: `"Streaming responses"`, `"Vector similarity search"`, `"PDF text extraction"`
Bad: `"Uses TypeScript"`, `"Has unit tests"`, `"Exports PromiseNode"`

## Migration from legacy format

Legacy format (just a string array for nodes):
```json
"gravity": {
  "logoUrl": "...",
  "nodes": ["ChatGPT Agent", "OpenAI", "OpenAI Agent"]
}
```

New format extends this — the marketplace API should handle both. If `nodes[0]` is a string, treat it as legacy and display with minimal detail.
