/**
 * DynamoDB fetch record service
 */

import { DynamoDBFetchConfig } from "../util/types";
import { getDynamoDBDocument } from "../../shared/operations";
import { AWSCredentials } from "../../shared/types";

export async function fetchDynamoDBRecordService(
  config: DynamoDBFetchConfig,
  inputs: Record<string, any>,
  credentials: AWSCredentials,
  logger: any
): Promise<{ success: boolean; found: boolean; document?: any }> {
  
  // Build the key from inputs and config
  const key: Record<string, any> = {};
  
  // Get primary key value from inputs
  if (config.primaryKey && inputs[config.primaryKey]) {
    key[config.primaryKey] = inputs[config.primaryKey];
  }
  
  // Get sort key value from inputs if specified
  if (config.sortKey && inputs[config.sortKey]) {
    key[config.sortKey] = inputs[config.sortKey];
  }
  
  if (Object.keys(key).length === 0) {
    throw new Error('No key values found in inputs for DynamoDB fetch');
  }

  const getConfig = {
    tableName: config.tableName,
    key,
  };

  return await getDynamoDBDocument(getConfig, credentials, logger);
}
