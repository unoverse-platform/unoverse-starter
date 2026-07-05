/**
 * Shared platform dependencies for Gemini Image Generation service
 */
import { getPlatformDependencies } from "@unoverse-platform/plugin-base";

// Get platform dependencies once
const deps = getPlatformDependencies();

export const getNodeCredentials = deps.getNodeCredentials;
export const createLogger = deps.createLogger;
export const getConfig = deps.getConfig;
export const getRedisClient = deps.getRedisClient;

// Create shared logger
export const geminiLogger = createLogger("GeminiImageGen");
