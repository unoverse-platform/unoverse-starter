/**
 * ListPicker Types
 * Auto-generated from Unoverse definition
 */

export interface ListPickerConfig {
  /** Enable Focus Mode - allow component to expand as primary interaction surface */
  focusable?: boolean;
  /** Focus Mode Label - name shown in chat input when this component is focused */
  focusLabel?: string;
  title?: string;
  subtitle?: string;
  elements?: any[];
}

export interface ListPickerOutput {
  __outputs: {
    componentSpec: any;
  };
}

export interface ListPickerTemplate {
  componentUrl: string;
}
