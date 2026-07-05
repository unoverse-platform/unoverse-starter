export const SmartDocumentMCPSchema = {
  name: "SmartDocument",
  version: "2.0.0",
  description:
    "Read and edit a long-form markdown document as addressable sections.",
  instructions: `Always call outline() first — it's your map (cheap, no bodies, gives IDs and hashes). Never invent IDs or hashes; they come from outline() or readSection() responses only. Every mutation requires expectedHash from your last read of that section.

Tool selection: use replaceInSection for small edits in long sections (cheapest), updateSection for full rewrites, appendToSection to add content (no read needed — hash from outline suffices), insertSection to create new sections, moveSection to reorder without editing.

Minimize reads: use wordCount from outline to judge section size. Only readSection what you intend to edit. If editing multiple sections, batch reads then batch edits.

After a successful edit, cache the new hash from the response — don't re-read to get it.

Error recovery: on STALE_SECTION, use the currentHash and currentBody from the error response directly — do NOT call outline() again. On NOT_UNIQUE, widen old_str with more surrounding context. On INVALID_STRUCTURE, demote headings to H3+.`,
  methods: {
    // ---------- READ ----------
    outline: {
      description:
        "Return the list of sections with id, level (1 or 2), heading, parentId, hash and wordCount. Call this first in any editing session, and again whenever you suspect the document has changed (e.g. after STALE_DOC). Does not return bodies.",
      input: {
        type: "object",
        properties: {},
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          version: { type: "integer" },
          sections: { type: "array" },
        },
      },
    },

    readSection: {
      description:
        "Return the body of one section. Use the hash from outline() or a previous readSection() as expectedHash in subsequent edits. Pass includeChildren to inline H2 children of an H1 section.",
      input: {
        type: "object",
        properties: {
          id: { type: "string", description: "Section id from outline()" },
          includeChildren: { type: "boolean", default: false },
        },
        required: ["id"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          version: { type: "integer" },
          id: { type: "string" },
          level: { type: "integer" },
          heading: { type: "string" },
          body: { type: "string" },
          hash: { type: "string" },
        },
      },
    },

    // ---------- EDIT ----------
    updateSection: {
      description:
        "Replace heading and/or body of a section. Use for whole-section rewrites. For small edits on long sections, prefer replaceInSection (cheaper in tokens). Body MUST NOT contain H1 or H2 headings (use H3+ inside bodies).",
      input: {
        type: "object",
        properties: {
          id: { type: "string" },
          expectedHash: { type: "string", description: "Current hash of the section (from outline() or readSection())" },
          heading: { type: "string" },
          body: { type: "string" },
          expectedDocVersion: { type: "integer", description: "Optional. If provided and stale, returns STALE_DOC." },
        },
        required: ["id", "expectedHash"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          version: { type: "integer" },
          hash: { type: "string" },
          error: { type: "string" },
          currentHash: { type: "string" },
          currentBody: { type: "string" },
          hint: { type: "string" },
        },
      },
    },

    appendToSection: {
      description:
        "Append text to the end of a section's body. Saves a read-modify-write. Body MUST NOT contain H1 or H2.",
      input: {
        type: "object",
        properties: {
          id: { type: "string" },
          expectedHash: { type: "string" },
          text: { type: "string" },
          expectedDocVersion: { type: "integer" },
        },
        required: ["id", "expectedHash", "text"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          version: { type: "integer" },
          hash: { type: "string" },
          error: { type: "string" },
        },
      },
    },

    replaceInSection: {
      description:
        "Replace an exact substring inside one section's body. old_str must match exactly once within the section; otherwise fails with NOT_FOUND or NOT_UNIQUE. Prefer this when the change is less than ~20% of the section body.",
      input: {
        type: "object",
        properties: {
          id: { type: "string" },
          expectedHash: { type: "string" },
          old_str: { type: "string", description: "Exact substring to find (must be unique in this section's body)" },
          new_str: { type: "string" },
          expectedDocVersion: { type: "integer" },
        },
        required: ["id", "expectedHash", "old_str", "new_str"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          version: { type: "integer" },
          hash: { type: "string" },
          error: { type: "string" },
          matches: { type: "integer" },
        },
      },
    },

    insertSection: {
      description:
        "Create a new section. If the document is empty or you want to append to the end, omit placement keys. Otherwise provide exactly one of afterId, beforeId, or parentId. Level must be 1 or 2. Returns the new section id and hash.",
      input: {
        type: "object",
        properties: {
          afterId: { type: "string", description: "Insert immediately after this section" },
          beforeId: { type: "string", description: "Insert immediately before this section" },
          parentId: { type: "string", description: "Nest under this H1; only valid for a new H2" },
          level: { type: "integer", enum: [1, 2] },
          heading: { type: "string" },
          body: { type: "string", default: "" },
          expectedDocVersion: { type: "integer" },
        },
        required: ["level", "heading"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          version: { type: "integer" },
          id: { type: "string" },
          hash: { type: "string" },
          error: { type: "string" },
        },
      },
    },

    deleteSection: {
      description:
        "Delete a section. With cascade=true, removes descendants too; otherwise descendants are re-parented to the deleted section's parent.",
      input: {
        type: "object",
        properties: {
          id: { type: "string" },
          expectedHash: { type: "string" },
          cascade: { type: "boolean", default: false },
          expectedDocVersion: { type: "integer" },
        },
        required: ["id", "expectedHash"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          version: { type: "integer" },
          error: { type: "string" },
        },
      },
    },

    moveSection: {
      description:
        "Move a section to a new position. Provide exactly one of afterId, beforeId, or parentId. Content is unchanged.",
      input: {
        type: "object",
        properties: {
          id: { type: "string" },
          expectedHash: { type: "string" },
          afterId: { type: "string" },
          beforeId: { type: "string" },
          parentId: { type: "string" },
          expectedDocVersion: { type: "integer" },
        },
        required: ["id", "expectedHash"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          version: { type: "integer" },
          error: { type: "string" },
        },
      },
    },

    // ---------- BULK (escape hatches; discourage casual use) ----------
    resetDoc: {
      description:
        "DESTRUCTIVE. Re-parse initialMarkdown from the node config with fresh IDs, discarding all current content. Only use when the user explicitly asks to start over. Prefer targeted edits.",
      input: {
        type: "object",
        properties: {},
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          version: { type: "integer" },
          sectionCount: { type: "integer" },
        },
      },
    },
  },
} as const;
