/**
 * KenBurnsImage Types
 * Auto-generated from Unoverse definition
 */

export interface KenBurnsImageConfig {
  /** Enable Focus Mode - allow component to expand as primary interaction surface */
  focusable?: boolean;
  /** Focus Mode Label - name shown in chat input when this component is focused */
  focusLabel?: string;
  src?: string;
  alt?: string;
  overlay?: boolean;
  object?: object;
}

export interface KenBurnsImageOutput {
  __outputs: {
    componentSpec: any;
  };
}

export interface KenBurnsImageTemplate {
  componentUrl: string;
}
