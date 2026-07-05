/**
 * Type definitions for CloudinaryFiles node
 */

export interface CloudinaryFilesConfig {
  folder?: string;
  maxFiles?: number;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  tags?: string;
  randomSelection?: boolean;
}

export interface CloudinaryResource {
  public_id: string;
  version: number;
  signature: string;
  width?: number;
  height?: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags?: string[];
  bytes: number;
  type: string;
  etag?: string;
  url: string;
  secure_url: string;
  asset_id?: string;
  folder?: string;
  universalId?: string; // Unique identifier for tracking files across systems
}

export interface CloudinaryFilesServiceOutput {
  files: CloudinaryResource[];
  count: number;
}

export interface CloudinaryFilesOutput {
  __outputs: {
    files: CloudinaryResource[];
    count: number;
  };
}
