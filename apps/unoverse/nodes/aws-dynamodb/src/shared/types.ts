/**
 * Type definitions for DynamoDB operations
 */

export interface DynamoDBRecord {
  [key: string]: any;
}

export interface DynamoDBPutConfig {
  tableName: string;
  record: DynamoDBRecord;
  conditionExpression?: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, any>;
}

export interface DynamoDBGetConfig {
  tableName: string;
  key: Record<string, any>;
}

export interface DynamoDBQueryConfig {
  tableName: string;
  keyConditionExpression: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, any>;
  filterExpression?: string;
  limit?: number;
  exclusiveStartKey?: Record<string, any>;
}

export interface DynamoDBScanConfig {
  tableName: string;
  filterExpression?: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, any>;
  limit?: number;
  exclusiveStartKey?: Record<string, any>;
}

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}
