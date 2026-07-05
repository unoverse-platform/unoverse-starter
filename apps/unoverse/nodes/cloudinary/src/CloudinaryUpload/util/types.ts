/**
 * Type definitions for Cloudinary Upload node
 */

export interface CloudinaryUploadConfig {
  folder?: string;
  publicId?: string;
  tags?: string;
  overwrite?: boolean;
  imageData: string; // base64 or URL
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
}

export interface CloudinaryUploadOutput {
  __outputs: {
    url: string;
    secureUrl: string;
    publicId: string;
    format: string;
    width?: number;
    height?: number;
    bytes: number;
    metadata: {
      uploadedAt: string;
      folder?: string;
      tags?: string[];
    };
  };
}
