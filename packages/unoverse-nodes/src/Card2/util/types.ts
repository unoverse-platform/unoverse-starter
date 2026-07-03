/**
 * Card2 Types
 * Auto-generated from Unoverse definition
 */

export interface Card2Config {
  /** Enable Focus Mode - allow component to expand as primary interaction surface */
  focusable?: boolean;
  /** Focus Mode Label - name shown in chat input when this component is focused */
  focusLabel?: string;
  title?: string;
  description?: string;
  image?: string;
  callToAction?: string;
  object?: object;
}

export interface Card2Output {
  __outputs: {
    componentSpec: any;
  };
}

export interface Card2Template {
  componentUrl: string;
}
