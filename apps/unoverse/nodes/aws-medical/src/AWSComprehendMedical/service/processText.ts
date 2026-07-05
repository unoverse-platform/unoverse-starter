/**
 * AWS Comprehend Medical text processing service
 */

import { AWSComprehendMedicalConfig, ComprehendMedicalResult } from "../util/types";
import { processTextWithComprehendMedical, AWSCredentials } from "./comprehendMedical";

export async function processComprehendMedicalText(
  config: AWSComprehendMedicalConfig,
  credentials: AWSCredentials,
  logger: any
): Promise<ComprehendMedicalResult> {
  
  if (!config.text || config.text.trim().length === 0) {
    throw new Error("No text provided for analysis");
  }

  return await processTextWithComprehendMedical(
    config.text,
    config,
    credentials,
    logger
  );
}
