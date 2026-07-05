/**
 * StackedBarChart Types
 * Auto-generated from Unoverse definition
 */

export interface StackedBarChartConfig {
  /** Enable Focus Mode - allow component to expand as primary interaction surface */
  focusable?: boolean;
  /** Focus Mode Label - name shown in chat input when this component is focused */
  focusLabel?: string;
  title?: string;
  series?: any[];
  bars?: any[];
}

export interface StackedBarChartOutput {
  __outputs: {
    componentSpec: any;
  };
}

export interface StackedBarChartTemplate {
  componentUrl: string;
}
