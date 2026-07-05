/**
 * Type definitions for the HunterDiscover node
 */

export interface HunterDiscoverConfig {
  query: string; // natural-language search; mutually exclusive with the filters below
  industry: string; // comma-separated industry names
  country: string; // comma-separated ISO 3166-1 alpha-2 codes
  headcount: string; // comma-separated buckets, e.g. "1-10, 11-50"
  technology: string; // comma-separated technologies (Premium)
  keywords: string; // comma-separated keywords
  companyType: string; // comma-separated company types
  similarTo: string; // a domain or company name (Premium)
  limit: number;
  offset: number;
}

export interface HunterDiscoverCompany {
  domain?: string;
  organization?: string;
  emails_count?: { personal?: number; generic?: number; total?: number };
}

export interface HunterDiscoverOutput {
  companies: HunterDiscoverCompany[];
  totalResults: number;
  limit: number;
  offset: number;
}

export interface HunterDiscoverExecutorOutput {
  __outputs: HunterDiscoverOutput;
}
