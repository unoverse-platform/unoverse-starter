/**
 * DynamoDB operations using document client
 */
import { PutCommand, GetCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { initializeDynamoDBClient } from "./client";
import { DynamoDBPutConfig, DynamoDBGetConfig, DynamoDBQueryConfig, DynamoDBScanConfig, AWSCredentials } from "./types";

/**
 * Put a record into DynamoDB table
 */
export async function putDynamoDBRecord(
  config: DynamoDBPutConfig,
  credentials: AWSCredentials,
  logger: any
): Promise<{ success: boolean; itemId?: string }> {
  
  try {
    const client = initializeDynamoDBClient(credentials, logger);
    
    // Build the put command
    const putCommand = new PutCommand({
      TableName: config.tableName,
      Item: config.record,
      ConditionExpression: config.conditionExpression,
      ExpressionAttributeNames: config.expressionAttributeNames,
      ExpressionAttributeValues: config.expressionAttributeValues,
    });
    
    logger.info('Putting record to DynamoDB', {
      tableName: config.tableName,
      recordKeys: Object.keys(config.record),
    });
    
    await client.send(putCommand);
    
    // Extract the primary key value if it exists
    const itemId = config.record.id || config.record.Id || config.record.ID || config.record.universalId;
    
    logger.info('Successfully put record to DynamoDB', {
      tableName: config.tableName,
      itemId,
    });
    
    return { success: true, itemId };
    
  } catch (error: any) {
    logger.error('Failed to put record to DynamoDB', {
      error: error.message,
      tableName: config.tableName,
    });
    throw error;
  }
}

/**
 * Get a document from DynamoDB table
 */
export async function getDynamoDBDocument(
  config: DynamoDBGetConfig,
  credentials: AWSCredentials,
  logger: any
): Promise<{ success: boolean; found: boolean; document?: any }> {
  
  try {
    const client = initializeDynamoDBClient(credentials, logger);
    
    logger.info('Getting document from DynamoDB', {
      tableName: config.tableName,
      key: config.key,
    });
    
    const command = new GetCommand({
      TableName: config.tableName,
      Key: config.key,
    });
    
    const response = await client.send(command);
    
    if (!response.Item) {
      logger.info('Document not found in DynamoDB', {
        tableName: config.tableName,
        key: config.key,
      });
      
      return { success: true, found: false };
    }
    
    logger.info('Successfully retrieved document from DynamoDB', {
      tableName: config.tableName,
      documentKeys: Object.keys(response.Item),
    });
    
    return { success: true, found: true, document: response.Item };
    
  } catch (error: any) {
    logger.error('Failed to get document from DynamoDB', {
      error: error.message,
      tableName: config.tableName,
      key: config.key,
    });
    throw error;
  }
}

/**
 * Query DynamoDB table
 */
export async function queryDynamoDBTable(
  config: DynamoDBQueryConfig,
  credentials: AWSCredentials,
  logger: any
): Promise<{ success: boolean; items: any[]; lastEvaluatedKey?: Record<string, any> }> {
  
  try {
    const client = initializeDynamoDBClient(credentials, logger);
    
    logger.info('Querying DynamoDB table', {
      tableName: config.tableName,
      keyConditionExpression: config.keyConditionExpression,
    });
    
    const command = new QueryCommand({
      TableName: config.tableName,
      KeyConditionExpression: config.keyConditionExpression,
      FilterExpression: config.filterExpression,
      ExpressionAttributeNames: config.expressionAttributeNames,
      ExpressionAttributeValues: config.expressionAttributeValues,
      Limit: config.limit,
      ExclusiveStartKey: config.exclusiveStartKey,
    });
    
    const response = await client.send(command);
    
    logger.info('Successfully queried DynamoDB table', {
      tableName: config.tableName,
      itemCount: response.Items?.length || 0,
    });
    
    return {
      success: true,
      items: response.Items || [],
      lastEvaluatedKey: response.LastEvaluatedKey,
    };
    
  } catch (error: any) {
    logger.error('Failed to query DynamoDB table', {
      error: error.message,
      tableName: config.tableName,
    });
    throw error;
  }
}
