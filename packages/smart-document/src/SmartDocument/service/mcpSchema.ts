export const SmartDocumentMCPSchema = {
  name: "SmartDocument",
  version: "1.0.0",
  description:
    "Read and edit a long-form markdown document. All edits appear live in the UI. Prefer str_replace and insert for surgical edits; use create only for initialisation or explicit 'start over'.",
  methods: {
    view: {
      description:
        "Return the current markdown content. Always call this before editing so you know what is there.",
      input: {
        type: "object",
        properties: {
          withLineNumbers: { type: "boolean", default: true },
          range: {
            type: "array",
            items: { type: "integer" },
            minItems: 2,
            maxItems: 2,
            description: "[startLine, endLine] inclusive; omit for whole doc",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          content: { type: "string" },
          version: { type: "integer" },
        },
      },
    },

    create: {
      description:
        "Replace the entire document with new content. Use ONLY for initialisation or an explicit 'start over'. For incremental edits use str_replace or insert so the rest of the document is preserved.",
      input: {
        type: "object",
        properties: {
          content: { type: "string" },
        },
        required: ["content"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          version: { type: "integer" },
        },
      },
    },

    str_replace: {
      description:
        "Replace an exact substring with new text. old_str must match exactly once in the document; otherwise the call fails and you should widen old_str with surrounding context.",
      input: {
        type: "object",
        properties: {
          old_str: {
            type: "string",
            description: "Exact string to find (must be unique in the document)",
          },
          new_str: { type: "string", description: "Replacement text" },
        },
        required: ["old_str", "new_str"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          version: { type: "integer" },
          error: { type: "string" },
          matches: { type: "integer" },
        },
      },
    },

    insert: {
      description:
        "Insert text after the given line number (1-indexed). Use 0 to prepend. Line numbers are against the current document; re-view after structural inserts if you plan more.",
      input: {
        type: "object",
        properties: {
          line: { type: "integer", minimum: 0 },
          text: { type: "string" },
        },
        required: ["line", "text"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          version: { type: "integer" },
          error: { type: "string" },
          maxLine: { type: "integer" },
        },
      },
    },
  },
} as const;
