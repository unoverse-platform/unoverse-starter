/**
 * Type definitions for the HunterEmailFinder node
 */

export interface HunterEmailFinderConfig {
  domain: string;
  company: string;
  firstName: string;
  lastName: string;
  fullName: string;
  linkedinHandle: string;
}

export interface HunterEmailFinderOutput {
  email: string;
  score: number;
  first_name?: string;
  last_name?: string;
  position?: string;
  domain?: string;
  company?: string;
  twitter?: string;
  linkedin_url?: string;
  phone_number?: string;
  accept_all?: boolean;
  verification_status?: string;
  sources_count: number;
}

export interface HunterEmailFinderExecutorOutput {
  __outputs: HunterEmailFinderOutput;
}
