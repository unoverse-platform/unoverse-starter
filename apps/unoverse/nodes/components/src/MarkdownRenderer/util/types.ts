/**
 * MarkdownRenderer Types
 * Auto-generated from Unoverse definition
 */

export interface MarkdownRendererConfig {
  /** Enable Focus Mode - allow component to expand as primary interaction surface */
  focusable?: boolean;
  /** Focus Mode Label - name shown in chat input when this component is focused */
  focusLabel?: string;
  title?: string;
  markdown?: string;
  streamingLabel?: string;
  placeholderText?: string;
}

export interface MarkdownRendererOutput {
  __outputs: {
    componentSpec: any;
  };
}

export interface MarkdownRendererTemplate {
  componentUrl: string;
}
