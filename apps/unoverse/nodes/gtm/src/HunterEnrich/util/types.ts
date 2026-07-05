/**
 * Type definitions for the HunterEnrich node
 */

export interface HunterEnrichConfig {
  type: string; // "combined" | "person" | "company"
  email: string;
  domain: string;
  linkedinHandle: string;
}

export interface HunterEnrichOutput {
  person: Record<string, any> | null;
  company: Record<string, any> | null;
}

export interface HunterEnrichExecutorOutput {
  __outputs: HunterEnrichOutput;
}
