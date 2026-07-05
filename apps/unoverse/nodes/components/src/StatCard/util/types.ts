/**
 * StatCard Types
 * Auto-generated from Unoverse definition
 */

export interface StatCardConfig {
  /** Enable Focus Mode - allow component to expand as primary interaction surface */
  focusable?: boolean;
  /** Focus Mode Label - name shown in chat input when this component is focused */
  focusLabel?: string;
  label?: string;
  value?: string;
  deltaArrow?: string;
  deltaValue?: string;
  deltaLabel?: string;
  deltaPositive?: boolean;
  deltaNegative?: boolean;
  deltaNeutral?: boolean;
  trend?: any[];
}

export interface StatCardOutput {
  __outputs: {
    componentSpec: any;
  };
}

export interface StatCardTemplate {
  componentUrl: string;
}
