/**
 * Cloudinary file listing service
 */

import { v2 as cloudinary, ResourceApiResponse, AdminApiOptions } from 'cloudinary';
import { CloudinaryFilesConfig, CloudinaryResource, CloudinaryFilesServiceOutput } from '../util/types';
import { createHash } from 'crypto';

export interface CloudinaryCredentials {
  cloud_name: string;
  api_key: string;
  api_secret: string;
}

/**
 * Generate a unique ID for a Cloudinary resource
 */
function generateUniversalId(resource: any): string {
  const resourceIdentifier = `${resource.public_id}|${resource.version}|${resource.created_at}`;
  const fullHash = createHash('sha256').update(resourceIdentifier).digest('hex');
  return fullHash.substring(0, 12);
}

/**
 * List files from Cloudinary
 */
export async function listCloudinaryFiles(
  config: CloudinaryFilesConfig,
  credentials: CloudinaryCredentials,
  logger: any
): Promise<CloudinaryFilesServiceOutput> {
  
  if (!credentials || !credentials.cloud_name || !credentials.api_key || !credentials.api_secret) {
    throw new Error('Invalid Cloudinary credentials: missing cloud_name, api_key, or api_secret');
  }

  // Configure Cloudinary
  cloudinary.config({
    cloud_name: credentials.cloud_name,
    api_key: credentials.api_key,
    api_secret: credentials.api_secret,
    secure: true
  });

  const options: AdminApiOptions = {
    max_results: config.maxFiles || 100,
    resource_type: config.resourceType || 'image',
    type: 'upload'
  };

  if (config.folder) {
    options.prefix = config.folder;
  }

  if (config.tags) {
    options.tags = config.tags;
  }

  try {
    logger.info('Listing Cloudinary resources', { options });

    const result: ResourceApiResponse = await cloudinary.api.resources(options);
    
    let resources: CloudinaryResource[] = result.resources.map((resource: any) => ({
      public_id: resource.public_id,
      version: resource.version,
      signature: resource.signature,
      width: resource.width,
      height: resource.height,
      format: resource.format,
      resource_type: resource.resource_type,
      created_at: resource.created_at,
      tags: resource.tags,
      bytes: resource.bytes,
      type: resource.type,
      etag: resource.etag,
      url: resource.url,
      secure_url: resource.secure_url,
      asset_id: resource.asset_id,
      folder: resource.folder,
      universalId: generateUniversalId(resource)
    }));

    // Apply random selection if requested and we have more files than maxFiles
    if (config.randomSelection && resources.length > (config.maxFiles || 100)) {
      const shuffled = resources.sort(() => 0.5 - Math.random());
      resources = shuffled.slice(0, config.maxFiles || 100);
    }

    logger.info('Successfully listed Cloudinary resources', {
      count: resources.length,
      totalAvailable: result.resources.length
    });

    return {
      files: resources,
      count: resources.length
    };
  } catch (error) {
    logger.error('Failed to list Cloudinary resources', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
