import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import { DocumentExecutor } from "./executor";

export const NODE_TYPE = "Document";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType, NodeConcurrency } = getPlatformDependencies();

  return {
    packageVersion: "1.1.1",
    type: NODE_TYPE,
    name: "Document",
    description:
      "Caches and manages document content during workflow execution. Provides lazy loading and memory management for large files.",
    whenToUse:
      "Pick to CACHE a large file's content for reuse during a run — it stores and passes the file, it does NOT extract or parse text. Use it only for caching; extracting readable text from a document is a different job.",
    category: "Documents",
    logoUrl: "https://cdn-icons-png.flaticon.com/512/2991/2991112.png",
    color: "#4A90E2",

    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Document file with metadata and optional content",
      },
    ],

    outputs: [
      {
        name: "output",
        type: NodeInputType.OBJECT,
        description: "Document operation result with content and cache stats",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        file: {
          type: "object",
          title: "File",
          description: "Document file to cache",
          default: "",
          "ui:field": "template",
        },
        maxFileSizeMB: {
          type: "number",
          title: "Max File Size (MB)",
          description: "Maximum file size to cache in MB",
          default: 50,
          minimum: 1,
        },
      },
    },

    testData: {
      config: {
        file: {
          key: "documents/sample-report.txt",
          name: "sample-report.txt",
          mimeType: "text/plain",
          size: 124,
          content:
            "U2FtcGxlIGRvY3VtZW50IGZvciB0aGUgVW5vdmVyc2Ugd29ya2JlbmNoLiBJdCBjb250YWlucyBhIGZldyBzZW50ZW5jZXMgb2YgcGxhaW4gdGV4dCBzbyB0aGUgcGFyc2VyIGhhcyBzb21ldGhpbmcgdG8gZXh0cmFjdC4=",
        },
        maxFileSizeMB: 50,
      },
      inputs: {
        signal: {
          file: {
            key: "documents/sample-report.txt",
            name: "sample-report.txt",
            mimeType: "text/plain",
            size: 124,
          },
        },
      },
    },
  };
}

const definition = createNodeDefinition();

export const DocumentNode = {
  definition,
  executor: DocumentExecutor,
};

export { createNodeDefinition };
