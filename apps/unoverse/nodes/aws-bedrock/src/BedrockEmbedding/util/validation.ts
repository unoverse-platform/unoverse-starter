/**
 * Validation utilities for BedrockEmbedding node
 */

/**
 * Validate AWS credentials
 */
export function validateAWSCredentials(credentials: any): { success: boolean; error?: string } {
  if (!credentials) {
    return { success: false, error: "AWS credentials are missing" };
  }
  
  if (!credentials.accessKeyId || typeof credentials.accessKeyId !== 'string') {
    return { success: false, error: "AWS Access Key ID is missing or invalid" };
  }
  
  if (!credentials.secretAccessKey || typeof credentials.secretAccessKey !== 'string') {
    return { success: false, error: "AWS Secret Access Key is missing or invalid" };
  }
  
  return { success: true };
}

/**
 * Validate Bedrock model configuration
 */
export function validateBedrockConfig(config: any): { success: boolean; error?: string } {
  if (!config) {
    return { success: false, error: "Configuration is missing" };
  }
  
  if (!config.model || typeof config.model !== 'string') {
    return { success: false, error: "Model name is missing or invalid" };
  }
  
  // Validate supported models
  const supportedModels = [
    "amazon.titan-embed-text-v1",
    "amazon.titan-embed-text-v2:0",
    "amazon.titan-embed-image-v1",
    "cohere.embed-english-v3",
    "cohere.embed-multilingual-v3"
  ];
  
  if (!supportedModels.some(m => config.model.includes(m))) {
    return { 
      success: false, 
      error: `Unsupported model: ${config.model}. Supported models: ${supportedModels.join(', ')}` 
    };
  }
  
  if (config.dimensions !== undefined) {
    if (typeof config.dimensions !== 'number' || config.dimensions <= 0) {
      return { success: false, error: "Dimensions must be a positive number" };
    }
    
    // Validate dimensions for specific models
    if (config.model.includes("titan-embed-text-v2") && 
        ![256, 512, 1024].includes(config.dimensions)) {
      return { 
        success: false, 
        error: "Titan Embed Text v2 only supports dimensions: 256, 512, or 1024" 
      };
    }
  }
  
  return { success: true };
}

/**
 * Validate embedding text input
 */
export function validateEmbeddingText(text: any): { success: boolean; error?: string } {
  if (!text || typeof text !== 'string') {
    return { success: false, error: "Text input is required and must be a string" };
  }
  
  if (text.trim().length === 0) {
    return { success: false, error: "Text input cannot be empty" };
  }
  
  // AWS Bedrock has token limits, but they vary by model
  // For safety, warn on very long texts
  if (text.length > 25000) {
    return { success: false, error: "Text input is too long (max ~25,000 characters)" };
  }
  
  return { success: true };
}

/**
 * Validate service method input for single embedding
 */
export function validateEmbeddingInput(params: any): { valid: boolean; error?: string } {
  if (!params || typeof params !== 'object') {
    return { valid: false, error: 'Input must be an object' };
  }
  
  if (!params.text) {
    return { valid: false, error: 'Text is required' };
  }
  
  if (typeof params.text !== 'string') {
    return { valid: false, error: 'Text must be a string' };
  }
  
  return { valid: true };
}
