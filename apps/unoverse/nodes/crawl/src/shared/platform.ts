/**
 * Shared platform dependencies for the Crawl package.
 */
import { getPlatformDependencies } from "@unoverse-platform/plugin-base";

// Get platform dependencies once
const deps = getPlatformDependencies();

export const getNodeCredentials = deps.getNodeCredentials;
export const saveTokenUsage = deps.saveTokenUsage;
export const createLogger = deps.createLogger;
export const getConfig = deps.getConfig;
export const PromiseNode = deps.PromiseNode;
export const CallbackNode = deps.CallbackNode;
export const NodeExecutionContext = deps.NodeExecutionContext;
export const EnhancedNodeDefinition = deps.EnhancedNodeDefinition;
export const NodeInputType = deps.NodeInputType;

// Create package-specific logger
export const crawlLogger = createLogger("Crawl");
