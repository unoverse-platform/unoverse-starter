import mammoth from 'mammoth';

export interface DOCXParseResult {
  text: string;
  html: string;
  messages: any[]; // mammoth.Message type not available
}

/**
 * Parse DOCX file and extract text content
 * @param buffer DOCX file buffer
 * @returns Parsed DOCX content
 */
export async function parseDOCX(buffer: Buffer): Promise<DOCXParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const htmlResult = await mammoth.convertToHtml({ buffer });
    
    return {
      text: result.value,
      html: htmlResult.value,
      messages: [...result.messages, ...htmlResult.messages],
    };
  } catch (error) {
    throw new Error(`DOCX parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
