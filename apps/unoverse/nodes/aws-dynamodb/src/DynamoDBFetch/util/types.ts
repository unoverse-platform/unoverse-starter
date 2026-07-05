/**
 * Type definitions for DynamoDBFetch node
 */

export interface DynamoDBFetchConfig {
  tableName: string;
  primaryKey: string;
  sortKey?: string;
}

export interface DynamoDBFetchOutput {
  __outputs: {
    output: any;
    found: boolean;
  };
}
