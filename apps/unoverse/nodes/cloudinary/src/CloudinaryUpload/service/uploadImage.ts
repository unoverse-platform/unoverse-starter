/**
 * Cloudinary Upload Service
 * Handles uploading base64 images or URLs to Cloudinary
 */

import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryUploadConfig } from '../util/types';
import { getNodeCredentials, cloudinaryLogger as logger } from '../../shared/platform';

type CredentialContext = any;

interface CloudinaryCredentials {
  cloud_name: string;
  api_key: string;
  api_secret: string;
}

/**
 * Upload an image to Cloudinary
 */
export async function uploadImage(
  config: CloudinaryUploadConfig,
  context: CredentialContext,
  nodeLogger?: any
) {
  const log = nodeLogger || logger;

  try {
    // Fetch credentials
    const credentials = (await getNodeCredentials(context, "cloudinaryCredential")) as CloudinaryCredentials;

    if (!credentials?.cloud_name || !credentials?.api_key || !credentials?.api_secret) {
      throw new Error("Cloudinary credentials are incomplete");
    }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: credentials.cloud_name,
      api_key: credentials.api_key,
      api_secret: credentials.api_secret,
      secure: true,
    });

    log.info("Uploading image to Cloudinary", {
      folder: config.folder,
      publicId: config.publicId,
      resourceType: config.resourceType || 'image',
    });

    // Prepare upload options
    const uploadOptions: any = {
      resource_type: config.resourceType || 'image',
      overwrite: config.overwrite ?? false,
    };

    if (config.folder) {
      uploadOptions.folder = config.folder;
    }

    if (config.publicId) {
      // Sanitize publicId: remove file extension, replace invalid characters
      let sanitizedPublicId = config.publicId
        .replace(/\.[^/.]+$/, '') // Remove file extension
        .replace(/[^a-zA-Z0-9_\-\/]/g, '_') // Replace invalid chars with underscore
        .replace(/_+/g, '_') // Replace multiple underscores with single
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
      
      uploadOptions.public_id = sanitizedPublicId;
      log.info("Sanitized publicId", { original: config.publicId, sanitized: sanitizedPublicId });
    }

    if (config.tags) {
      uploadOptions.tags = config.tags.split(',').map(tag => tag.trim());
    }

    // Prepare image data
    let imageToUpload = config.imageData;

    // If it's base64 without data URI prefix, add it
    if (!imageToUpload.startsWith('data:') && !imageToUpload.startsWith('http')) {
      // Assume it's base64 PNG if no prefix
      imageToUpload = `data:image/png;base64,${imageToUpload}`;
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(imageToUpload, uploadOptions);

    log.info("Image uploaded successfully", {
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      bytes: result.bytes,
    });

    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      createdAt: result.created_at,
      tags: result.tags || [],
    };
  } catch (error: any) {
    log.error("Failed to upload image to Cloudinary", { error: error.message });
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}
