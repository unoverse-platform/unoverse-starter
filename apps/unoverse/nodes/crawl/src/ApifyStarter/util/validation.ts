/**
 * Validates ApifyStarter configuration
 */
export interface ValidationResult {
  success: boolean;
  error?: string;
}

export function validateApifyStarterConfig(config: any): ValidationResult {
  if (!config) {
    return { success: false, error: "Configuration is required" };
  }

  // Validate URLs from config (template-resolved)
  if (!config.urls) {
    return {
      success: false,
      error: "URLs are required",
    };
  }

  // If urls is a string, try to parse it as JSON
  let urls = config.urls;
  if (typeof urls === "string") {
    try {
      urls = JSON.parse(urls);
    } catch (e) {
      return {
        success: false,
        error: "URLs must be a valid JSON array",
      };
    }
  }

  if (!Array.isArray(urls) || urls.length === 0) {
    return {
      success: false,
      error: "URLs must be a non-empty array",
    };
  }

  // Validate actorId if provided
  if (config.actorId && typeof config.actorId !== "string") {
    return {
      success: false,
      error: "Actor ID must be a string",
    };
  }

  // Validate waitForCompletion
  if (config.waitForCompletion !== undefined && typeof config.waitForCompletion !== "boolean") {
    return {
      success: false,
      error: "Wait for completion must be a boolean",
    };
  }

  // Validate maxWaitTime
  if (config.maxWaitTime !== undefined) {
    if (typeof config.maxWaitTime !== "number" || config.maxWaitTime < 1 || config.maxWaitTime > 3600) {
      return {
        success: false,
        error: "Max wait time must be a number between 1 and 3600 seconds",
      };
    }
  }

  return { success: true };
}
