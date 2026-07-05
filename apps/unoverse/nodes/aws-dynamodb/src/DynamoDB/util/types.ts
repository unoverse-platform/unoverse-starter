/**
 * Type definitions for DynamoDB node
 */

export interface DynamoDBConfig {
  tableName: string;
  record: any;
  conditionExpression?: string;
  expressionAttributeNames?: Record<string, string>;
  expressionAttributeValues?: Record<string, any>;
}

export interface DynamoDBOutput {
  __outputs: {
    success: boolean;
    itemId?: string;
  };
}
