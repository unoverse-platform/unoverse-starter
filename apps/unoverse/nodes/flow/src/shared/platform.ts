/**
 * Shared platform dependencies for all Flow nodes
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

// Create shared loggers
export const codeLogger = createLogger("Code");
export const ifElseLogger = createLogger("IfElse");
export const loopLogger = createLogger("Loop");
export const contextLogger = createLogger("Context");
export const relayLogger = createLogger("Relay");
export const noteLogger = createLogger("Note");
export const umapLogger = createLogger("UMAP");
