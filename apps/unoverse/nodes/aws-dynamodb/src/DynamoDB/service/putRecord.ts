/**
 * DynamoDB put record service
 */

import { DynamoDBConfig } from "../util/types";
import { putDynamoDBRecord } from "../../shared/operations";
import { AWSCredentials } from "../../shared/types";

export async function putDynamoDBRecordService(
  config: DynamoDBConfig,
  credentials: AWSCredentials,
  logger: any
): Promise<{ success: boolean; itemId?: string }> {
  
  const putConfig = {
    tableName: config.tableName,
    record: config.record,
    conditionExpression: config.conditionExpression,
    expressionAttributeNames: config.expressionAttributeNames,
    expressionAttributeValues: config.expressionAttributeValues,
  };

  return await putDynamoDBRecord(putConfig, credentials, logger);
}
