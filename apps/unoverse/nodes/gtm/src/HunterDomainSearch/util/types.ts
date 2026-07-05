/**
 * Type definitions for the HunterDomainSearch node
 */

export interface HunterDomainSearchConfig {
  domain: string;
  company: string;
  type: string; // "" | "personal" | "generic"
  department: string;
  seniority: string;
  requiredField: string; // "" | "full_name" | "position" | "phone_number"
  limit: number;
  offset: number;
}

export interface HunterEmail {
  value: string;
  type?: string;
  confidence?: number;
  first_name?: string;
  last_name?: string;
  position?: string;
  seniority?: string;
  department?: string;
  linkedin?: string;
  twitter?: string;
  phone_number?: string;
  verification_status?: string;
}

export interface HunterDomainInfo {
  domain?: string;
  organization?: string;
  pattern?: string;
  industry?: string;
  description?: string;
  twitter?: string;
  facebook?: string;
  linkedin?: string;
  country?: string;
  state?: string;
  city?: string;
  headcount?: string;
  company_type?: string;
  disposable?: boolean;
  webmail?: boolean;
  accept_all?: boolean;
}

export interface HunterDomainSearchOutput {
  emails: HunterEmail[];
  organization: HunterDomainInfo;
  pattern?: string;
  totalResults: number;
  limit: number;
  offset: number;
}

export interface HunterDomainSearchExecutorOutput {
  __outputs: HunterDomainSearchOutput;
}
