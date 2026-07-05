/**
 * Type definitions for PineconeQuery node
 */

export interface PineconeQueryConfig {
  query: string;
  embedding?: number[]; // Made optional, will be generated from query
  indexName: string;
  namespace?: string;
  topK?: number;
  includeMetadata?: boolean;
  includeValues?: boolean;
  scoreThreshold?: number;
  metadataFilter?: any;
  useReranking?: boolean;
  rerankerModel?: string;
  rerankerTopN?: number;
  rerankerFields?: string[];
  queryText?: string;
}

export interface PineconeQueryResult {
  id: string;
  score: number;
  text?: string;
  values?: number[];
  metadata?: Record<string, any>;
}

export interface PineconeQueryResponse {
  results: PineconeQueryResult[];
  topResult: PineconeQueryResult | null;
  usedReranking: boolean;
  rerankerModel?: string;
}

export interface PineconeQueryServiceOutput {
  results: any[];
  topResult?: any;
}

export interface PineconeQueryOutput {
  __outputs: {
    output: any[];
    topResult?: any;
  };
}
