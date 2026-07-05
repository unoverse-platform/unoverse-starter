import { HyperbrowserFetchConfig } from "../../shared/hyperbrowser";

export interface HyperbrowserScrapeConfig extends HyperbrowserFetchConfig {
  url: string;
  onlyMainContent?: boolean;
  waitFor?: number;
}

export interface ScrapeLink {
  text: string;
  href: string;
}

export interface HyperbrowserScrapeResult {
  markdown: string;
  html: string;
  links: any[];
  metadata: Record<string, any>;
}

export interface HyperbrowserScrapeExecutorOutput {
  __outputs: {
    markdown: string;
    html: string;
    links: any[];
    metadata: Record<string, any>;
  };
}
