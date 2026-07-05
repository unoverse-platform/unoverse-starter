import { getPlatformDependencies, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import { DocumentParserExecutor } from "./executor";

export const NODE_TYPE = "DocumentParser";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType, NodeConcurrency } = getPlatformDependencies();

  return {
    packageVersion: "1.1.1",
    type: NODE_TYPE,
    name: "Document Parser",
    description: "Parse documents (PDF, DOCX, TXT) and extract text content",
    whenToUse:
      "Pick to turn an uploaded PDF/DOCX/TXT file object into PLAIN TEXT for downstream LLM nodes — it parses and extracts the text. Use it when you need the document's text content (not merely caching the file, and not OCR of cloud-stored scans).",
    category: "Documents",
    logoUrl: "https://cdn-icons-png.flaticon.com/512/2991/2991112.png",
    color: "#4A90E2",

    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "File object",
      },
    ],

    outputs: [
      {
        name: "output",
        type: NodeInputType.OBJECT,
        description: "Parsed document",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        file: {
          type: "object",
          title: "File",
          description: "Parse me",
          default: "",
          "ui:field": "template",
        },
        parserType: {
          type: "string",
          title: "Parser Type",
          description: "Force specific parser or use auto-detect",
          enum: ["auto", "pdf", "docx", "txt"],
          default: "auto",
        },
        maxFileSizeMB: {
          type: "number",
          title: "Max File Size (MB)",
          description: "Maximum file size to process in megabytes",
          default: 10,
          minimum: 1,
          maximum: 100,
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
        parserType: "txt",
        maxFileSizeMB: 10,
      },
      inputs: {
        signal: {
          file: {
            key: "documents/sample-report.txt",
            name: "sample-report.txt",
            mimeType: "text/plain",
            size: 124,
            content:
              "U2FtcGxlIGRvY3VtZW50IGZvciB0aGUgVW5vdmVyc2Ugd29ya2JlbmNoLiBJdCBjb250YWlucyBhIGZldyBzZW50ZW5jZXMgb2YgcGxhaW4gdGV4dCBzbyB0aGUgcGFyc2VyIGhhcyBzb21ldGhpbmcgdG8gZXh0cmFjdC4=",
          },
        },
      },
    },
  };
}

const definition = createNodeDefinition();

export const DocumentParserNode = {
  definition,
  executor: DocumentParserExecutor,
};

export { createNodeDefinition };
