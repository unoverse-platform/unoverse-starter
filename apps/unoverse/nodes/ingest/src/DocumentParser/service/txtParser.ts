export interface TXTParseResult {
  text: string;
  encoding: string;
}

/**
 * Parse TXT file and extract text content
 * @param buffer TXT file buffer
 * @returns Parsed TXT content
 */
export async function parseTXT(buffer: Buffer): Promise<TXTParseResult> {
  try {
    // Try UTF-8 first, then fall back to latin1 if needed
    let text: string;
    let encoding = 'utf8';
    
    try {
      text = buffer.toString('utf8');
      // Check for invalid UTF-8 characters
      if (text.includes('\ufffd')) {
        throw new Error('Invalid UTF-8');
      }
    } catch {
      // Fall back to latin1
      text = buffer.toString('latin1');
      encoding = 'latin1';
    }
    
    return {
      text,
      encoding,
    };
  } catch (error) {
    throw new Error(`TXT parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
