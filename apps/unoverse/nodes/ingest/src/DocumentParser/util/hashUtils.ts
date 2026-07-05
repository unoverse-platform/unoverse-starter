import { createHash } from 'crypto';

/**
 * Creates a content hash for a parsed document result object
 * Excludes fields that can change independently of content (universalId, downloadUrl)
 * @param result - The parsed document result object
 * @returns Short hash (12 characters) representing the content
 */
export function createContentHash(result: any): string {
  // Exclude fields that can change independently of actual content
  const { universalId, downloadUrl, ...contentFields } = result;
  
  // Sort keys for consistent hashing
  const resultString = JSON.stringify(contentFields, Object.keys(contentFields).sort());
  
  // Create hash and return short version (similar to git short hash)
  const fullHash = createHash('sha256').update(resultString).digest('hex');
  return fullHash.substring(0, 12);
}

/**
 * Creates a content hash from specific content fields
 * More targeted approach if you want to hash only core content
 * @param text - Document text content
 * @param metadata - Document metadata
 * @param pageCount - Number of pages (optional)
 * @returns Short hash (12 characters) representing the content
 */
export function createContentHashFromFields(
  text: string, 
  metadata: any, 
  pageCount?: number
): string {
  const contentIdentifier = `${text}|${pageCount || 0}|${JSON.stringify(metadata, Object.keys(metadata).sort())}`;
  const fullHash = createHash('sha256').update(contentIdentifier).digest('hex');
  return fullHash.substring(0, 12);
}
