/**
 * MetricGrid Types
 * Auto-generated from Unoverse definition
 */

export interface MetricGridConfig {
  /** Enable Focus Mode - allow component to expand as primary interaction surface */
  focusable?: boolean;
  /** Focus Mode Label - name shown in chat input when this component is focused */
  focusLabel?: string;
  title?: string;
  metrics?: any[];
}

export interface MetricGridOutput {
  __outputs: {
    componentSpec: any;
  };
}

export interface MetricGridTemplate {
  componentUrl: string;
}
