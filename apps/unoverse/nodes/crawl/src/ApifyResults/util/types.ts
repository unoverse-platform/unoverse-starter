/**
 * ApifyResults node type definitions
 */

// Input structure for ApifyResults node
export interface ApifyResultsInput {
  runId: string;
}

// Configuration for ApifyResults node
export interface ApifyResultsConfig {
  runId: string;
}

// State maintained between iterations
export interface ApifyResultsState {
  items: ApifyItem[];
  currentIndex: number;
  totalItems: number;
  runId: string;
  datasetId?: string;
}

// Simplified item structure for output
export interface SimplifiedApifyItem {
  url: string;
  title: string;
  description: string;
  text: string;
  httpStatusCode: number;
  depth: number;
  loadedTime: string;
}

// Output structure for each iteration
export interface ApifyResultsOutput {
  item: ApifyItem | null;
  index: number;
  total: number;
  hasMore: boolean;
}

// Executor output structure with __outputs wrapper for multi-output routing
export interface ApifyResultsExecutorOutput {
  __outputs: {
    item: any;
    index: number;
    total: number;
    hasMore: boolean;
  };
}

// Apify crawl item structure based on your example
export interface ApifyItem {
  url: string;
  crawl: {
    loadedUrl: string;
    loadedTime: string;
    referrerUrl: string;
    depth: number;
    httpStatusCode: number;
  };
  metadata: {
    canonicalUrl: string;
    title: string;
    description: string;
    author: string | null;
    keywords: string | null;
    languageCode: string;
    openGraph: Array<{
      property: string;
      content: string;
    }>;
    jsonLd: any;
    headers: Record<string, string>;
  };
  screenshotUrl: string | null;
  text: string;
  debug?: {
    requestHandlerMode: string;
  };
}

// Apify API response structure
export interface ApifyDatasetResponse {
  data: {
    id: string;
    name: string;
    itemCount: number;
    items: ApifyItem[];
  };
}

// Apify Run details response
export interface ApifyRunResponse {
  data: {
    id: string;
    status: string;
    defaultDatasetId: string;
    stats: {
      inputBodyLen: number;
      restartCount: number;
      resurrectCount: number;
    };
  };
}

// Apify credentials structure
export interface ApifyCredentials {
  apiToken: string;
  baseUrl?: string;
}
