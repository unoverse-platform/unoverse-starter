/**
 * BarChart Types
 * Auto-generated from Unoverse definition
 */

export interface BarChartConfig {
  /** Enable Focus Mode - allow component to expand as primary interaction surface */
  focusable?: boolean;
  /** Focus Mode Label - name shown in chat input when this component is focused */
  focusLabel?: string;
  title?: string;
  bars?: any[];
}

export interface BarChartOutput {
  __outputs: {
    componentSpec: any;
  };
}

export interface BarChartTemplate {
  componentUrl: string;
}
