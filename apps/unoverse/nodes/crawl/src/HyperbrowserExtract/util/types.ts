import { HyperbrowserFetchConfig } from "../../shared/hyperbrowser";

export interface HyperbrowserExtractConfig extends HyperbrowserFetchConfig {
  urls: any; // template-resolved: string | string[]
  prompt?: string;
  schema?: Record<string, any>;
}

export interface HyperbrowserExtractResult {
  data: any;
  metadata: {
    urls: string[];
    timestamp: string;
  };
}

export interface HyperbrowserExtractExecutorOutput {
  __outputs: {
    data: any;
    metadata: HyperbrowserExtractResult["metadata"];
  };
}
