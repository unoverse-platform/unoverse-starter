/**
 * S3 Upload Service
 * Uploads files to S3 from URL or buffer
 */

import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3UploadOutput } from "../util/types";

export interface UploadConfig {
  bucket: string;
  key: string;
  sourceUrl?: string;
  base64Data?: string;
  buffer?: Buffer;
  contentType?: string;
}

/**
 * Upload file to S3 from URL or buffer
 */
export async function uploadToS3(config: UploadConfig, credentials: any): Promise<S3UploadOutput> {
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

  let buffer: Buffer;
  let contentType = config.contentType;

  // Get content from URL, base64, or use provided buffer
  if (config.base64Data) {
    // Handle base64 data - strip data URL prefix if present
    let base64 = config.base64Data;
    if (base64.includes(",")) {
      const parts = base64.split(",");
      // Extract content type from data URL if not provided
      if (!contentType && parts[0].includes(":") && parts[0].includes(";")) {
        const match = parts[0].match(/data:([^;]+);/);
        if (match) {
          contentType = match[1];
        }
      }
      base64 = parts[1];
    }
    buffer = Buffer.from(base64, "base64");
  } else if (config.sourceUrl) {
    const response = await fetch(config.sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch from URL: ${response.status} ${response.statusText}`);
    }
    buffer = Buffer.from(await response.arrayBuffer());

    // Infer content type from response if not provided
    if (!contentType) {
      contentType = response.headers.get("content-type") || "application/octet-stream";
    }
  } else if (config.buffer) {
    buffer = config.buffer;
  } else {
    throw new Error("Either sourceUrl, base64Data, or buffer must be provided");
  }

  // Default content type
  if (!contentType) {
    contentType = "application/octet-stream";
  }

  // Upload to S3
  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: config.key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  // Build S3 URL
  const s3Url = `https://${config.bucket}.s3.${credentials.region || "us-east-1"}.amazonaws.com/${config.key}`;

  // Generate presigned download URL (valid for 7 days)
  const getCommand = new GetObjectCommand({
    Bucket: config.bucket,
    Key: config.key,
  });
  const downloadUrl = await getSignedUrl(client, getCommand, { expiresIn: 604800 });

  return {
    key: config.key,
    bucket: config.bucket,
    s3Url,
    downloadUrl,
    size: buffer.length,
    contentType,
  };
}
