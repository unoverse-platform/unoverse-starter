import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import { GoogleSheetExecutor } from "./executor";

export const NODE_TYPE = "GoogleSheet";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.1.1",
    type: NODE_TYPE,
    category: "Storage & Data",
    name: "Google Sheet",
    description: "Read data from a public Google Sheets spreadsheet with optional row-by-row iteration",
    whenToUse:
      "Pick to read rows from a public GOOGLE SHEET. Iterates row-by-row LoopStart-style when a signal is wired back into its continue input; otherwise emits all rows at once. It reads a Google Sheet specifically — not an app-owned database table.",
    color: "#34A853",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1753618586/gravity/icons/googleSheetIcon.png",

    inputs: [
      {
        name: "signal",
        type: NodeInputType.ANY,
        description: "Trigger signal to start reading the sheet",
      },
      {
        name: "continue",
        type: NodeInputType.ANY,
        description: "Signal to continue to next row (when looping is enabled)",
      },
    ],

    outputs: [
      {
        name: "item",
        type: NodeInputType.OBJECT,
        description: "Current row item (when looping) or array of all rows (when not looping)",
      },
      {
        name: "index",
        type: NodeInputType.NUMBER,
        description: "Current row index (0-based)",
      },
      {
        name: "total",
        type: NodeInputType.NUMBER,
        description: "Total number of rows",
      },
      {
        name: "hasMore",
        type: NodeInputType.BOOLEAN,
        description: "Whether there are more rows to process",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        spreadsheetId: {
          type: "string",
          title: "Spreadsheet ID",
          description: "Google Sheets spreadsheet ID",
          placeholder: "Enter your Google Sheets spreadsheet ID",
        },
        range: {
          type: "string",
          title: "Range",
          description: "A1 notation range (e.g., Sheet1!A1:D10)",
          placeholder: "Sheet1!A:Z",
          default: "Sheet1",
        },
        useHeaders: {
          type: "boolean",
          title: "Use Headers",
          description: "Use first row as object property names",
          default: true,
        },
      },
      required: ["spreadsheetId"],
    },

    credentials: [
      {
        name: "googleApiCredential",
        required: true,
      },
    ],

    testData: {
      config: {
        spreadsheetId: "1aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789ABCDEFG",
        range: "Sheet1!A1:D10",
        useHeaders: true,
      },
      inputs: { signal: {} },
    },
  };
}

const definition = createNodeDefinition();

export const GoogleSheetNode = {
  definition,
  executor: GoogleSheetExecutor,
};

export { createNodeDefinition };
