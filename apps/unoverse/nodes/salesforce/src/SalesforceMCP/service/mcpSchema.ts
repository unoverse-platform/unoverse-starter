export const SalesforceMCPSchema = {
  name: "Salesforce",
  version: "1.0.0",
  description:
    "Interact with a Salesforce org: run SOQL queries, read records by ID, create and update records, and inspect object metadata. All methods require a configured Salesforce OAuth credential (instance URL + access token).",
  methods: {
    query_records: {
      description:
        "Run a SOQL query and return matching records. Use this to find or filter records (e.g. \"SELECT Id, Name FROM Account WHERE Industry = 'Technology' LIMIT 20\"). Always include a LIMIT. Returns the first page only with has_more.",
      input: {
        type: "object",
        properties: {
          soql: {
            type: "string",
            description: "A SOQL query string, e.g. SELECT Id, Name FROM Contact WHERE Email != null LIMIT 50",
          },
        },
        required: ["soql"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          totalSize: { type: "number" },
          records: { type: "array" },
          has_more: { type: "boolean" },
          next_records_url: { type: "string" },
        },
      },
    },

    get_record: {
      description:
        "Fetch a single record by its Salesforce ID. Optionally restrict to specific fields. Use when you already know the record ID.",
      input: {
        type: "object",
        properties: {
          sobject: { type: "string", description: "Object API name (e.g. Account, Contact, Opportunity)" },
          recordId: { type: "string", description: "The 15- or 18-character Salesforce record ID" },
          fields: { type: "string", description: "Comma-separated field names to return (optional; omit for all)" },
        },
        required: ["sobject", "recordId"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          record: { type: "object" },
        },
      },
    },

    create_record: {
      description:
        "Create a new record of the given object type. Provide field values as an object. Returns the new record's ID.",
      input: {
        type: "object",
        properties: {
          sobject: { type: "string", description: "Object API name (e.g. Account, Contact)" },
          fields: {
            type: "object",
            description: "Field name → value map, e.g. { \"Name\": \"Acme Inc\", \"Industry\": \"Technology\" }",
          },
        },
        required: ["sobject", "fields"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          id: { type: "string" },
          errors: { type: "array" },
        },
      },
    },

    update_record: {
      description:
        "Update fields on an existing record by ID. Provide only the fields to change. Returns ok on success (Salesforce returns no body on update).",
      input: {
        type: "object",
        properties: {
          sobject: { type: "string", description: "Object API name (e.g. Account, Contact)" },
          recordId: { type: "string", description: "The record ID to update" },
          fields: {
            type: "object",
            description: "Field name → new value map for the fields to change",
          },
        },
        required: ["sobject", "recordId", "fields"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          id: { type: "string" },
        },
      },
    },

    describe_object: {
      description:
        "Get an object's fields and metadata (field names, types, required flags, picklist values). Use this to learn an object's schema before querying or creating records.",
      input: {
        type: "object",
        properties: {
          sobject: { type: "string", description: "Object API name to describe (e.g. Account)" },
        },
        required: ["sobject"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          name: { type: "string" },
          label: { type: "string" },
          fields: { type: "array" },
        },
      },
    },

    list_objects: {
      description:
        "List the standard and custom objects (sObjects) available in the org, with their queryable/createable/updateable flags. Use to discover what object types exist.",
      input: {
        type: "object",
        properties: {},
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          sobjects: { type: "array" },
        },
      },
    },

    // ── CRM Sync contract ──────────────────────────────────────────────────
    // The standardized lane for user-memory ⇄ CRM sync. Reads are bounded to a
    // fixed identity allowlist; crm_write_insight is APPEND-ONLY (Task only) and
    // can never edit a core profile field. See CRM_SYNC.md.

    crm_resolve_user: {
      description:
        "Resolve a user to their Salesforce Contact by email, returning the contact Id and a bounded identity profile (name, email, title, company). Email defaults to the authenticated user, so usually call with no arguments. Use this first to link a user to the CRM.",
      input: {
        type: "object",
        properties: {
          email: {
            type: "string",
            description: "The user's email (optional — defaults to the authenticated user's email)",
          },
        },
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          found: { type: "boolean" },
          contactId: { type: "string" },
          profile: { type: "object" },
        },
      },
    },

    crm_get_profile: {
      description:
        "Read a contact's bounded identity profile — name, email, title, company only (never all fields). Use to ground yourself in who the user is according to the CRM.",
      input: {
        type: "object",
        properties: {
          contactId: { type: "string", description: "The Salesforce Contact Id" },
        },
        required: ["contactId"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          profile: { type: "object" },
        },
      },
    },

    crm_write_insight: {
      description:
        "Append a durable, machine-authored insight about the user to their contact as a completed Task (appears on the contact's activity timeline). APPEND-ONLY: this never edits any existing profile field. Push only high-certainty conclusions.",
      input: {
        type: "object",
        properties: {
          contactId: { type: "string", description: "The Salesforce Contact Id" },
          insight: { type: "string", description: "The conclusion about the user, in plain language" },
          certainty: { type: "number", description: "0.0–1.0 confidence; stamped into the note (optional)" },
        },
        required: ["contactId", "insight"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          id: { type: "string" },
        },
      },
    },

    crm_read_insights: {
      description:
        "Read back the AI-authored insights previously written to a contact (the completed Tasks crm_write_insight created). Use to see what's already been synced before adding more.",
      input: {
        type: "object",
        properties: {
          contactId: { type: "string", description: "The Salesforce Contact Id" },
          limit: { type: "number", description: "Max insights to return (default 50)" },
        },
        required: ["contactId"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          insights: { type: "array" },
        },
      },
    },
  },
};
