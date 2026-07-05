/**
 * Cloudinary file content retrieval service
 */

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryFileContentConfig, CloudinaryFileContentServiceOutput } from '../util/types';
import { CloudinaryCredentials } from '../../CloudinaryFiles/service/listFiles';

/**
 * Get file content and metadata from Cloudinary
 */
export async function getCloudinaryFileContent(
  config: CloudinaryFileContentConfig,
  credentials: CloudinaryCredentials,
  logger: any
): Promise<CloudinaryFileContentServiceOutput> {
  
  if (!credentials || !credentials.cloud_name || !credentials.api_key || !credentials.api_secret) {
    throw new Error('Invalid Cloudinary credentials: missing cloud_name, api_key, or api_secret');
  }

  if (!config.file || !config.file.public_id) {
    throw new Error('File object with public_id is required');
  }

  // Configure Cloudinary
  cloudinary.config({
    cloud_name: credentials.cloud_name,
    api_key: credentials.api_key,
    api_secret: credentials.api_secret,
    secure: true
  });

  try {
    logger.info('Getting Cloudinary file content', {
      publicId: config.file.public_id,
      transformation: config.transformation,
      format: config.format
    });

    // Get detailed resource information
    const resource = await cloudinary.api.resource(config.file.public_id, {
      resource_type: config.file.resource_type || 'image'
    });

    // Build transformation string
    let transformationString = '';
    if (config.transformation) {
      transformationString += config.transformation;
    }
    if (config.format) {
      transformationString += transformationString ? `,f_${config.format}` : `f_${config.format}`;
    }

    // Generate URLs with transformations
    let url = resource.url;
    let secure_url = resource.secure_url;
    let downloadUrl = resource.secure_url;

    if (transformationString) {
      // Apply transformations to URLs
      url = cloudinary.url(config.file.public_id, {
        transformation: transformationString,
        resource_type: config.file.resource_type || 'image'
      });
      
      secure_url = cloudinary.url(config.file.public_id, {
        transformation: transformationString,
        resource_type: config.file.resource_type || 'image',
        secure: true
      });

      downloadUrl = secure_url;
    }

    const result: CloudinaryFileContentServiceOutput = {
      public_id: resource.public_id,
      url,
      secure_url,
      downloadUrl,
      format: config.format || resource.format,
      width: resource.width,
      height: resource.height,
      bytes: resource.bytes,
      resource_type: resource.resource_type,
      created_at: resource.created_at,
      universalId: config.file.universalId,
      transformation: transformationString || undefined
    };

    logger.info('Successfully retrieved Cloudinary file content', {
      publicId: config.file.public_id,
      format: result.format,
      hasTransformation: !!transformationString
    });

    return result;
  } catch (error) {
    logger.error('Failed to get Cloudinary file content', {
      publicId: config.file?.public_id,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}
