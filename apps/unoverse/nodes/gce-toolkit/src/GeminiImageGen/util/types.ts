/**
 * Type definitions for Google Gemini Image Generation node
 */

export interface GeminiImageGenConfig {
  model: string;
  prompt: string;
  fileName?: string;
  referenceImageUrl?: string;
}

export interface GeminiImageGenCredentials {
  apiKey: string;
}

export interface GeneratedImage {
  data: string; // base64 encoded image data
  mimeType: string;
  fileName: string;
}

export interface GeminiImageGenOutput {
  __outputs: {
    images: GeneratedImage[];
    text?: string;
    metadata: {
      model: string;
      imageCount: number;
      timestamp: string;
    };
  };
}

export interface ValidationResult {
  success: boolean;
  error?: string;
  data?: any;
}
