export interface SmartDocumentConfig {
  initialMarkdown?: string;
  sectionizeAt?: 1 | 2;
}

export interface SmartDocumentOutput {
  __outputs: {
    markdown: string;
  };
}

export type SectionLevel = 1 | 2;

export interface Section {
  id: string;
  level: SectionLevel;
  heading: string;
  body: string;
  parentId: string | null;
  order: number;
  hash: string;
}

export interface Doc {
  sections: Section[];
  version: number;
  updatedAt: string;
}

export type ErrorCode =
  | "STALE_SECTION"
  | "STALE_DOC"
  | "CONCURRENT_UPDATE"
  | "NOT_FOUND"
  | "NOT_UNIQUE"
  | "INVALID_STRUCTURE"
  | "INVALID_PLACEMENT"
  | "INVALID_PARAMS"
  | "NOT_INITIALISED"
  | "UNKNOWN_METHOD";

export interface ServiceError {
  ok: false;
  error: ErrorCode;
  hint?: string;
  currentHash?: string;
  currentBody?: string;
  currentVersion?: number;
  matches?: number;
}

export interface ServiceSuccess {
  ok: true;
  version: number;
  [key: string]: any;
}

export type ServiceResult = ServiceSuccess | ServiceError;
