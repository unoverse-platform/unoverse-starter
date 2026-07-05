/**
 * Type definitions for CloudinaryFileContent node
 */

import { CloudinaryResource } from "../../CloudinaryFiles/util/types";

export interface CloudinaryFileContentConfig {
  file?: CloudinaryResource;
  transformation?: string;
  format?: string;
}

export interface CloudinaryFileContentServiceOutput {
  public_id: string;
  url: string;
  secure_url: string;
  downloadUrl: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  resource_type: string;
  created_at: string;
  universalId?: string;
  transformation?: string;
}

export interface CloudinaryFileContentOutput {
  __outputs: {
    fileContent: CloudinaryFileContentServiceOutput;
  };
}
