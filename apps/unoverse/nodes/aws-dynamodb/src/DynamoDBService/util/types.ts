/**
 * Type definitions for DynamoDBService node
 */

export interface DynamoDBServiceConfig {
  region?: string;
  defaultTable?: string;
}

export interface DynamoDBServiceOutput {
  // Service nodes don't have direct outputs
  __outputs: {};
}
