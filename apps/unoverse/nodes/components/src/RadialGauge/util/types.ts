/**
 * RadialGauge Types
 * Auto-generated from Unoverse definition
 */

export interface RadialGaugeConfig {
  /** Enable Focus Mode - allow component to expand as primary interaction surface */
  focusable?: boolean;
  /** Focus Mode Label - name shown in chat input when this component is focused */
  focusLabel?: string;
  title?: string;
  pct?: string;
  centerValue?: string;
  label?: string;
}

export interface RadialGaugeOutput {
  __outputs: {
    componentSpec: any;
  };
}

export interface RadialGaugeTemplate {
  componentUrl: string;
}
