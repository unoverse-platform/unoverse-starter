import { createLogger, getNodeCredentials } from "../../shared/platform";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3FileContentServiceOutput } from "../util/types";

/**
 * Get S3 object content and generate presigned URL
 */
export async function getS3FileContent(
  bucket: string,
  key: string,
  context: any,
  file?: any
): Promise<S3FileContentServiceOutput> {
  const logger = createLogger("S3FileContentService");
  const credentials = await getNodeCredentials(context, "awsCredential");
  
  if (!credentials?.accessKeyId || !credentials?.secretAccessKey) {
    throw new Error("AWS credentials not found or incomplete");
  }

  const client = new S3Client({
    region: credentials.region || "us-east-1",
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
  });

  try {
    // Get object from S3
    const getCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await client.send(getCommand);
    
    // Convert to buffer
    const buffer = Buffer.from(await response.Body!.transformToByteArray());

    // Generate presigned download URL (valid for 7 days)
    const downloadUrl = await getSignedUrl(client, getCommand, { expiresIn: 604800 });

    logger.info("S3 file content retrieved", {
      bucket,
      key,
      size: buffer.length,
      downloadUrlGenerated: true,
    });

    // Return file content without base64 to prevent subscription issues
    return {
      key,
      size: buffer.length,
      bucket,
      lastModified: file?.lastModified,
      etag: file?.etag,
      universalId: file?.universalId,
      downloadUrl,
    };
  } catch (error: any) {
    logger.error(`Failed to get S3 file content`, {
      error: error.message,
      bucket,
      key,
    });
    throw error;
  }
}
