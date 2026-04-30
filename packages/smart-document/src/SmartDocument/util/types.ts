export interface SmartDocumentConfig {
  initialMarkdown?: string;
}

export interface SmartDocumentOutput {
  __outputs: {
    markdown: string;
  };
}

export interface MarkdownDoc {
  content: string;
  version: number;
  updatedAt: string;
}

export interface ServiceCallSuccess {
  ok: true;
  version: number;
  content?: string;
}

export interface ServiceCallError {
  ok: false;
  error:
    | "not_found"
    | "not_unique"
    | "line_out_of_range"
    | "not_initialised"
    | "invalid_params";
  version?: number;
  matches?: number;
  maxLine?: number;
  message?: string;
}

export type ServiceCallResult = ServiceCallSuccess | ServiceCallError;
