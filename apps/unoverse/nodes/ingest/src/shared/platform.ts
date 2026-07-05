/**
 * Shared platform dependencies for Ingest services
 */
import { getPlatformDependencies } from "@gravity-platform/plugin-base";

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

// Create service-specific loggers
export const ingestLogger = createLogger("Ingest");
