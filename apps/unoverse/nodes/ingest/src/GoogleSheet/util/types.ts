/**
 * Type definitions for GoogleSheet node
 */

export interface GoogleSheetConfig {
  spreadsheetId: string;
  range?: string;
  useHeaders?: boolean;
}

export interface GoogleSheetInput {
  spreadsheetId?: string;
}

export interface GoogleSheetState {
  sheetData: any[] | null;
  currentIndex: number;
  headers?: string[];
  isComplete: boolean;
}

export interface GoogleSheetOutput {
  item: any;
  index: number;
  total: number;
  hasMore: boolean;
  error?: string;
}

export interface GoogleSheetExecutorOutput {
  __outputs: {
    item: any;
    index: number;
    total: number;
    hasMore: boolean;
    error?: string;
  };
}

export interface GoogleSheetsResponse {
  range: string;
  majorDimension: string;
  values: any[][];
}
