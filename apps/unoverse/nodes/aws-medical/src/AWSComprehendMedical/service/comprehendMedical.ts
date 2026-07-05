/**
 * AWS Comprehend Medical text processing service
 */
import {
  ComprehendMedicalClient,
  DetectEntitiesV2Command,
  DetectPHICommand,
} from "@aws-sdk/client-comprehendmedical";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { AWSComprehendMedicalConfig, ComprehendMedicalResult } from "../util/types";

export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  sessionToken?: string;
}

// Client caching
const clientCache = new Map<string, ComprehendMedicalClient>();
const s3ClientCache = new Map<string, S3Client>();

function initializeComprehendMedicalClient(credentials: AWSCredentials, logger: any): ComprehendMedicalClient {
  const cacheKey = `${credentials.accessKeyId}_${credentials.region}`;
  
  if (clientCache.has(cacheKey)) {
    logger.debug('Using cached Comprehend Medical client', { cacheKey });
    return clientCache.get(cacheKey)!;
  }
  
  const client = new ComprehendMedicalClient({
    region: credentials.region || "us-east-1",
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });
  
  clientCache.set(cacheKey, client);
  logger.debug('Created and cached new Comprehend Medical client', { cacheKey, region: credentials.region });
  
  return client;
}

function initializeS3Client(credentials: AWSCredentials, logger: any): S3Client {
  const cacheKey = `s3_${credentials.accessKeyId}_${credentials.region}`;
  
  if (s3ClientCache.has(cacheKey)) {
    logger.debug('Using cached S3 client', { cacheKey });
    return s3ClientCache.get(cacheKey)!;
  }
  
  const client = new S3Client({
    region: credentials.region || "us-east-1",
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    },
  });
  
  s3ClientCache.set(cacheKey, client);
  logger.debug('Created and cached new S3 client', { cacheKey, region: credentials.region });
  
  return client;
}

export async function processTextWithComprehendMedical(
  text: string,
  config: AWSComprehendMedicalConfig,
  credentials: AWSCredentials,
  logger: any
): Promise<ComprehendMedicalResult> {
  const startTime = Date.now();
  const client = initializeComprehendMedicalClient(credentials, logger);
  
  const result: ComprehendMedicalResult = {
    metadata: {
      textLength: text.length,
      processingTime: 0
    }
  };
  
  try {
    // Detect medical entities if requested
    if (config.analysisType === 'ENTITIES' || config.analysisType === 'BOTH') {
      logger.info("Detecting medical entities...");
      const entitiesCommand = new DetectEntitiesV2Command({ Text: text });
      const entitiesResponse = await client.send(entitiesCommand);
      
      result.entities = entitiesResponse.Entities as any[];
      result.metadata.entityCount = entitiesResponse.Entities?.length || 0;
      if (entitiesResponse.ModelVersion) {
        result.modelVersion = entitiesResponse.ModelVersion;
      }
    }
    
    // Detect PHI if requested
    if (config.analysisType === 'PHI' || config.analysisType === 'BOTH') {
      logger.info("Detecting PHI...");
      const phiCommand = new DetectPHICommand({ Text: text });
      const phiResponse = await client.send(phiCommand);
      
      result.phi = phiResponse.Entities as any[];
      result.metadata.phiCount = phiResponse.Entities?.length || 0;
      if (!result.modelVersion && phiResponse.ModelVersion) {
        result.modelVersion = phiResponse.ModelVersion;
      }
    }
    
    // Save to S3 if requested
    if (config.saveToS3) {
      const s3Client = initializeS3Client(credentials, logger);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputKey = `${config.outputPrefix || 'comprehend-medical-output'}/${timestamp}.json`;
      
      const putCommand = new PutObjectCommand({
        Bucket: process.env.GRAVITY_S3_BUCKET || 'gravity-default-bucket',
        Key: outputKey,
        Body: JSON.stringify(result, null, 2),
        ContentType: 'application/json'
      });
      
      await s3Client.send(putCommand);
      result.outputKey = outputKey;
      
      logger.info("Results saved to S3", { outputKey });
    }
    
    result.metadata.processingTime = Date.now() - startTime;
    return result;
    
  } catch (error: any) {
    logger.error("Error processing text with Comprehend Medical:", {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
}
