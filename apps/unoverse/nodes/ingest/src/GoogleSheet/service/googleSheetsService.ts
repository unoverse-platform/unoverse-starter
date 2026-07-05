import { createLogger, getNodeCredentials } from "../../shared/platform";
import { GoogleSheetsResponse } from "../util/types";

interface GoogleSheetsCredentials {
  apiKey: string;
}

export interface GoogleSheetsOptions {
  spreadsheetId: string;
  range: string;
  apiKey?: string;
  valueRenderOption?: string;
  majorDimension?: string;
}

export async function readGoogleSheet(
  spreadsheetId: string,
  range: string,
  context: any
): Promise<GoogleSheetsResponse> {
  const logger = createLogger("GoogleSheetsService");
  
  const credentials = await getNodeCredentials(context, "googleApiCredential");
  const apiKey = credentials?.apiKey;

  if (!apiKey) {
    throw new Error("Google Sheets API key not found in credentials");
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}`;

  logger.info("Reading Google Sheet", { spreadsheetId, range });

  try {
    const response = await fetch(url + `?key=${apiKey}&majorDimension=ROWS&valueRenderOption=UNFORMATTED_VALUE`);

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(
          "Access denied. Make sure the spreadsheet is publicly accessible and the API key has Sheets API enabled."
        );
      } else if (response.status === 404) {
        throw new Error("Spreadsheet not found. Check the spreadsheet ID.");
      } else if (response.status === 400) {
        const errorData = await response.json().catch(() => ({})) as any;
        throw new Error(
          `Invalid request: ${
            errorData.error?.message || "Check your range format"
          }`
        );
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as GoogleSheetsResponse;
    
    logger.info("Successfully read Google Sheet", {
      spreadsheetId,
      rowCount: data.values?.length || 0
    });

    return data;
  } catch (error: any) {
    logger.error("Failed to read Google Sheet", {
      spreadsheetId,
      error: error.message
    });
    throw new Error(`Failed to read Google Sheet: ${error.message}`);
  }
}
