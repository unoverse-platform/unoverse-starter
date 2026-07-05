/**
 * JourneyFinder Types
 * Auto-generated from Unoverse definition
 */

export interface JourneyFinderConfig {
  /** Enable Focus Mode - allow component to expand as primary interaction surface */
  focusable?: boolean;
  /** Focus Mode Label - name shown in chat input when this component is focused */
  focusLabel?: string;
  step?: string;
  searchStatus?: string;
  courses?: any[];
  heroImage?: string;
}

export interface JourneyFinderOutput {
  __outputs: {
    /** The standard output connector — submitted component outputs (answers leg only). */
    output?: Record<string, any>;
  };
}

export interface JourneyFinderTemplate {
  componentUrl: string;
}
