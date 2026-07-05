export const SmartDocumentMCPSchema = {
  name: "SmartDocument",
  version: "2.1.0", // bumped for understanding improvements
  description: "Read and edit a long-form markdown document as addressable sections with strong understanding capture.",
  instructions: `**Understanding Protocol (MANDATORY — do not skip)**

Phase 0: Build & Maintain Understanding (before any edit)
1. ALWAYS call outline() first — it is your map (cheap, no bodies).
2. Call getDocumentUnderstanding() to load the current mental model (purpose, key relationships, invariants, recent insights).
3. Search prior insights with getRelevantInsights() when the task involves existing sections.
4. Form a clear hypothesis: "Editing section X will achieve Y because Z is the source of truth."
5. Only then readSection() what your hypothesis requires (use includeSummary for cheap understanding).

Phase 1–4: Safe Editing (unchanged from v2.0)
- Use replaceInSection for small targeted edits (<20% of body).
- Use updateSection for full rewrites.
- Every mutation MUST include expectedHash from your last read.
- After success, cache the new hash from the response — never re-read just to get it.

Error Recovery (improved)
- STALE_SECTION: Use currentHash + currentBody from error directly. Do NOT call outline() again.
- NOT_UNIQUE: Widen old_str with more surrounding context.
- INVALID_STRUCTURE: Demote headings to H3+ inside bodies.
- After any error that returns currentBody, update your mental model immediately.

Post-Edit Discipline
- After any edit that touches structure or >1 section, call getDocumentUnderstanding() again to refresh.
- Log durable insights with logInsight() (patterns, relationships, pitfalls, source-of-truth declarations).
- Never leave the document in a state where you cannot explain every changed section's role and relationships.

Tool selection remains the same as v2.0. Minimize reads. Batch when possible.`,

  methods: {
    // ---------- READ ----------
    outline: {
      description:
        "Return the list of sections with rich metadata for understanding. Call first in any session and whenever you suspect the document changed (e.g. after STALE_DOC). Does not return full bodies.",
      input: {
        type: "object",
        properties: {},
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          version: { type: "integer" },
          documentTitle: { type: "string", description: "Inferred or stored title of the whole document" },
          totalWordCount: { type: "integer" },
          structureSummary: { type: "string", description: "1-3 sentence overview of document purpose and flow" },
          lastModified: { type: "string" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                level: { type: "integer", enum: [1, 2] },
                heading: { type: "string" },
                parentId: { type: "string" },
                hash: { type: "string" },
                wordCount: { type: "integer" },
                summary: { type: "string", description: "1-2 sentence purpose of this section (cheap understanding)" },
                isSourceOfTruthFor: {
                  type: "array",
                  items: { type: "string" },
                  description: "Topics or concepts this section owns",
                },
                lastEdited: { type: "string" },
              },
            },
          },
        },
      },
    },

    readSection: {
      description:
        "Return the body (and optionally a summary) of one section. Use the hash from outline() or previous read as expectedHash in edits. Pass includeChildren to inline H2 children of an H1.",
      input: {
        type: "object",
        properties: {
          id: { type: "string", description: "Section id from outline()" },
          includeChildren: { type: "boolean", default: false },
          includeSummary: {
            type: "boolean",
            default: false,
            description: "Return a cheap summary + key points instead of (or in addition to) full body",
          },
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
          summary: { type: "string", description: "Returned when includeSummary=true" },
          keyPoints: { type: "array", items: { type: "string" } },
          relationships: {
            type: "array",
            items: {
              type: "object",
              properties: {
                targetId: { type: "string" },
                type: { type: "string", enum: ["depends-on", "references", "overrides", "implements"] },
                note: { type: "string" },
              },
            },
          },
          hash: { type: "string" },
        },
      },
    },

    getDocumentUnderstanding: {
      description:
        "Returns the current high-level mental model of the entire document. Call this at the start of any non-trivial session and after structural changes. Includes purpose, relationships, invariants, and accumulated insights.",
      input: {
        type: "object",
        properties: {},
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          documentTitle: { type: "string" },
          purpose: { type: "string", description: "What this document is for and who it serves" },
          overallStructure: { type: "string", description: "Narrative description of how the document is organized" },
          keyRelationships: {
            type: "array",
            items: {
              type: "object",
              properties: {
                fromId: { type: "string" },
                toId: { type: "string" },
                type: { type: "string" },
                strength: { type: "number" },
              },
            },
          },
          invariants: { type: "array", items: { type: "string" }, description: "Rules that must never be violated" },
          recentInsights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                key: { type: "string" },
                insight: { type: "string" },
                confidence: { type: "number" },
                timestamp: { type: "string" },
              },
            },
          },
          openQuestions: { type: "array", items: { type: "string" } },
          confidenceScore: { type: "number", description: "How complete the current understanding is (0-10)" },
        },
      },
    },

    getRelevantInsights: {
      description:
        "Search previously logged insights relevant to the current task or section. Use before editing to avoid repeating past mistakes or rediscovering relationships.",
      input: {
        type: "object",
        properties: {
          query: { type: "string", description: "Free-text or section id to search against" },
          limit: { type: "integer", default: 5 },
          types: { type: "array", items: { type: "string" }, description: "Filter by insight type" },
        },
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          insights: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                key: { type: "string" },
                insight: { type: "string" },
                confidence: { type: "number" },
                relatedSectionIds: { type: "array", items: { type: "string" } },
                timestamp: { type: "string" },
              },
            },
          },
        },
      },
    },

    // ---------- EDIT (unchanged core, with minor output improvements) ----------
    updateSection: {
      description:
        "Replace heading and/or body of a section. Use for whole-section rewrites. For small edits on long sections, prefer replaceInSection (cheaper). Body MUST NOT contain H1 or H2 headings.",
      input: {
        type: "object",
        properties: {
          id: { type: "string" },
          expectedHash: {
            type: "string",
            description: "Current hash of the section (from outline() or readSection())",
          },
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
          understandingUpdated: {
            type: "boolean",
            description: "True if getDocumentUnderstanding() should be re-called",
          },
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
          understandingUpdated: { type: "boolean" },
        },
      },
    },

    replaceInSection: {
      description:
        "Replace an exact substring inside one section's body. old_str must match exactly once; otherwise fails with NOT_FOUND or NOT_UNIQUE. Prefer for changes < ~20% of body.",
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
          understandingUpdated: { type: "boolean" },
        },
      },
    },

    insertSection: {
      description:
        "Create a new section. If the document is empty or you want to append to the end, omit placement keys. Otherwise provide exactly one of afterId, beforeId, or parentId. Level must be 1 or 2.",
      input: {
        type: "object",
        properties: {
          afterId: { type: "string" },
          beforeId: { type: "string" },
          parentId: { type: "string", description: "Nest under this H1; only valid for new H2" },
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
          understandingUpdated: { type: "boolean" },
        },
      },
    },

    deleteSection: {
      description:
        "Delete a section. With cascade=true, removes descendants too; otherwise descendants are re-parented.",
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
          understandingUpdated: { type: "boolean" },
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
          understandingUpdated: { type: "boolean" },
        },
      },
    },

    // ---------- UNDERSTANDING CAPTURE ----------
    logInsight: {
      description:
        "Log a durable insight about this document. These accumulate across sessions and are returned by getRelevantInsights(). Use after discovering patterns, relationships, pitfalls, or source-of-truth sections.",
      input: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["pattern", "relationship", "pitfall", "convention", "invariant", "source-of-truth", "architecture"],
            description: "Category of insight",
          },
          key: {
            type: "string",
            description: "Short alphanumeric identifier (e.g. 'pricing-source', 'api-auth-flow')",
          },
          insight: { type: "string", description: "Clear, actionable statement" },
          confidence: { type: "number", minimum: 1, maximum: 10 },
          relatedSectionIds: { type: "array", items: { type: "string" } },
        },
        required: ["type", "key", "insight", "confidence"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          insightId: { type: "string" },
        },
      },
    },

    // ---------- BULK (escape hatch) ----------
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
