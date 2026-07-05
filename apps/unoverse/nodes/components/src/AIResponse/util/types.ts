/**
 * AIResponse Types
 * Auto-generated from Unoverse definition
 */

export interface AIResponseConfig {
  /** Enable Focus Mode - allow component to expand as primary interaction surface */
  focusable?: boolean;
  /** Focus Mode Label - name shown in chat input when this component is focused */
  focusLabel?: string;
  thinking?: string;
  text?: string;
  questions?: object;
}

export interface AIResponseOutput {
  __outputs: {
    componentSpec: any;
  };
}

export interface AIResponseTemplate {
  componentUrl: string;
}
