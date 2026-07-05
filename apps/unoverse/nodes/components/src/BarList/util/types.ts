/**
 * BarList Types
 * Auto-generated from Unoverse definition
 */

export interface BarListConfig {
  /** Enable Focus Mode - allow component to expand as primary interaction surface */
  focusable?: boolean;
  /** Focus Mode Label - name shown in chat input when this component is focused */
  focusLabel?: string;
  title?: string;
  items?: any[];
}

export interface BarListOutput {
  __outputs: {
    componentSpec: any;
  };
}

export interface BarListTemplate {
  componentUrl: string;
}
