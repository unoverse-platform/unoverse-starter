import { createLogger, getNodeCredentials } from "../../shared/platform";
import { S3Client, ListObjectsV2Command, GetObjectCommand, _Object } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3FileObject } from "../util/types";

export interface S3Config {
  bucket: string;
  prefix?: string;
  maxKeys?: number;
  fileExtensions?: string[];
  generatePresignedUrls?: boolean;
  presignedUrlExpiry?: number; // seconds, default 3600
}

/**
 * List files from S3 bucket with optional filtering
 */
export async function listS3Files(config: S3Config, context: any): Promise<S3FileObject[]> {
  const logger = createLogger("S3Service");
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
    // List objects in bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: config.bucket,
      Prefix: config.prefix || "",
      MaxKeys: config.maxKeys || 1000,
    });

    const response = await client.send(listCommand);
    const s3Files = response.Contents || [];

    // Filter out directories (objects ending with '/' or with size 0)
    let filteredFiles = s3Files.filter((file: _Object) => {
      // Skip if no key
      if (!file.Key) return false;
      // Skip directories (ending with '/')
      if (file.Key.endsWith("/")) return false;
      // Skip empty files that might be directory markers
      if (file.Size === 0 && file.Key.includes("/")) return false;
      return true;
    });

    // Further filter by extensions if specified
    if (config.fileExtensions && config.fileExtensions.length > 0) {
      const extensions = config.fileExtensions.map((ext) => ext.toLowerCase());
      filteredFiles = filteredFiles.filter((file: _Object) => {
        const ext = file.Key?.split(".").pop()?.toLowerCase();
        return ext && extensions.includes(ext);
      });
    }

    // Transform to our output format with optional presigned URLs
    const expiresIn = config.presignedUrlExpiry || 3600;
    const files: S3FileObject[] = [];
    for (const file of filteredFiles) {
      let presignedUrl: string | undefined;
      if (config.generatePresignedUrls) {
        const getCmd = new GetObjectCommand({ Bucket: config.bucket, Key: file.Key! });
        presignedUrl = await getSignedUrl(client, getCmd, { expiresIn });
      }
      files.push({
        key: file.Key!,
        size: file.Size || 0,
        lastModified: file.LastModified?.toISOString() || new Date().toISOString(),
        etag: file.ETag,
        bucket: config.bucket,
        universalId: "", // Will be set by executor
        presignedUrl,
      });
    }

    logger.info("S3 files listed", {
      bucket: config.bucket,
      totalObjects: s3Files.length,
      directoriesFiltered: s3Files.length - filteredFiles.length,
      finalFileCount: files.length,
    });

    return files;
  } catch (error: any) {
    logger.error(`Failed to list S3 files`, {
      error: error.message,
      bucket: config.bucket,
      prefix: config.prefix,
    });
    throw error;
  }
}
