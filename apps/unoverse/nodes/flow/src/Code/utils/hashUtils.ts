/**
 * Hash utilities for Code node
 */

import { createHash } from "crypto";

/**
 * Creates a content hash from input data
 * @param input - The input data to hash
 * @returns Short hash (12 characters) representing the content
 */
export function createContentHash(input: any): string {
  // Convert input to string for hashing
  const inputString = typeof input === "string" ? input : JSON.stringify(input, Object.keys(input).sort());

  // Create hash and return short version (similar to git short hash)
  const fullHash = createHash("sha256").update(inputString).digest("hex");
  return fullHash.substring(0, 12);
}

/**
 * Creates a universal ID hash from workflow ID, node ID, and content
 * @param workflowId - The workflow ID
 * @param nodeId - The node ID
 * @param content - The output content to include in the hash
 * @returns Universal ID hash (12 characters)
 */
export function createUniversalId(workflowId: string, nodeId: string, content?: any): string {
  // Start with workflow and node IDs
  let idString = `${workflowId}-${nodeId}`;
  
  // If content is provided, include it in the hash
  if (content !== undefined && content !== null) {
    const contentString = typeof content === "string" ? content : JSON.stringify(content, Object.keys(content).sort());
    idString = `${idString}-${contentString}`;
  }

  // Create hash and return short version
  const fullHash = createHash("sha256").update(idString).digest("hex");
  return fullHash.substring(0, 12);
}
