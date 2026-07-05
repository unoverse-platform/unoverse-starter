/**
 * CardFinder Types
 * Auto-generated from Unoverse definition
 */

export interface CardFinderConfig {
  /** Enable Focus Mode - allow component to expand as primary interaction surface */
  focusable?: boolean;
  /** Focus Mode Label - name shown in chat input when this component is focused */
  focusLabel?: string;
  recommendation?: object;
  eligibleTiers?: any[];
  heroImage?: string;
}

export interface CardFinderOutput {
  __outputs: {
    componentSpec: any;
  };
}

export interface CardFinderTemplate {
  componentUrl: string;
}
