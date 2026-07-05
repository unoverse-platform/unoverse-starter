import { HyperbrowserSessionConfig } from "../../shared/hyperbrowser";

export interface HyperbrowserCrawlConfig extends HyperbrowserSessionConfig {
  url: string;
  maxPages?: number;
  includePatterns?: string;
  excludePatterns?: string;
  onlyMainContent?: boolean;
}

export interface CrawledPage {
  url: string;
  markdown: string;
  links: any[];
  metadata: Record<string, any>;
}

export interface HyperbrowserCrawlResult {
  pages: CrawledPage[];
  links: any[];
  metadata: {
    url: string;
    totalPages: number;
    timestamp: string;
  };
}

export interface HyperbrowserCrawlExecutorOutput {
  __outputs: {
    pages: CrawledPage[];
    links: any[];
    metadata: HyperbrowserCrawlResult["metadata"];
  };
}
