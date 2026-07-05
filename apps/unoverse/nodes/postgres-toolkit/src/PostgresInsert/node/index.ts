import { NodeInputType, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import PostgresInsertExecutor from "./executor";

export const NODE_TYPE = "PostgresInsert";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Postgres Insert",
    description:
      "Batch INSERT records into any PostgreSQL table. INSERT-only — no UPDATE, no DELETE, no DDL. Core Gravity tables are protected.",
    whenToUse:
      "Pick for batch INSERTs into your own Postgres tables; can also embed a vector column if an embedding service is attached via a service edge. It writes structured rows to a Postgres SQL table specifically — not an Airtable base, a pure vector store, or the core dictionary.",
    category: "Storage & Data",
    color: "#336791",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Records to insert — object or array of objects",
      },
    ],
    outputs: [
      {
        name: "output",
        type: NodeInputType.OBJECT,
        description: "Insert result: { success, inserted, skipped, tableName, errors }",
      },
    ],
    serviceConnectors: [
      {
        name: "embeddingService",
        description: "Optional embedding service for vector column generation",
        serviceType: "embedding",
        methods: ["createEmbedding"],
        isService: false,
      },
    ],
    configSchema: {
      type: "object",
      required: ["connectionString", "tableName", "records"],
      properties: {
        connectionString: {
          type: "string",
          title: "Connection String",
          description: "PostgreSQL connection string (e.g. postgresql://user:pass@host:5432/dbname?sslmode=require)",
          default: "",
          "ui:field": "template",
        },
        tableName: {
          type: "string",
          title: "Table Name",
          description: "Target table name. Table must already exist. Core Gravity tables are blocked.",
          default: "",
          "ui:field": "template",
        },
        records: {
          type: "object",
          title: "Records",
          description: "Object or array of objects to insert. Keys must match table column names.",
          default: {},
          "ui:field": "template",
        },
        dedupFields: {
          type: "string",
          title: "Dedup Fields (optional)",
          description:
            "Comma-separated field names to hash for duplicate detection. Requires a content_hash TEXT UNIQUE column.",
          default: "",
        },
        batchSize: {
          type: "number",
          title: "Batch Size",
          description: "Number of rows per INSERT statement",
          default: 50,
          minimum: 1,
          maximum: 500,
        },
        enableVector: {
          type: "boolean",
          title: "Generate Vector Embedding",
          description:
            "Generate a vector embedding and store in embedding_original column. Requires an embedding service connection.",
          default: false,
          "ui:widget": "toggle",
        },
        vectorTextField: {
          type: "string",
          title: "Vector Text Field",
          description: "Comma-separated record fields to concatenate for embedding (e.g. 'context,verbatim_quote')",
          default: "",
          "ui:dependencies": {
            enableVector: true,
          },
        },
      },
    },
    capabilities: {
      isTrigger: false,
    },
    testData: {
      config: {
        connectionString: "postgresql://user:password@localhost:5432/mydb",
        tableName: "customers",
        records: [
          { email: "ada@example.com", name: "Ada Lovelace", signup_date: "2026-06-01" },
          { email: "alan@example.com", name: "Alan Turing", signup_date: "2026-06-02" },
        ],
        dedupFields: "email",
        batchSize: 50,
        enableVector: false,
        vectorTextField: "",
      },
      inputs: {
        signal: [
          { email: "ada@example.com", name: "Ada Lovelace", signup_date: "2026-06-01" },
          { email: "alan@example.com", name: "Alan Turing", signup_date: "2026-06-02" },
        ],
      },
    },
    services: {
      provides: [],
      requires: {},
    },
  };
}

const definition = createNodeDefinition();

export const PostgresInsertNode = {
  definition,
  executor: PostgresInsertExecutor,
};

export { createNodeDefinition };
