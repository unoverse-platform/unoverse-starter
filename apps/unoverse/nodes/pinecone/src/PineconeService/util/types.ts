/**
 * Type definitions for PineconeService node
 */

export interface PineconeServiceConfig {
  indexName: string;
  namespace?: string;
  topK?: number;
}

export interface ServiceCallParams {
  config?: any;
  [key: string]: any;
}

export interface ServiceCallResult {
  success: boolean;
  data?: any;
  error?: string;
}
