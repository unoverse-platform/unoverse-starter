import pdfParse from 'pdf-parse';

export interface PDFParseResult {
  text: string;
  pageCount: number;
  metadata: {
    info?: any;
    metadata?: any;
    version?: string;
  };
}

/**
 * Parse PDF file and extract text content
 * @param buffer PDF file buffer
 * @returns Parsed PDF content and metadata
 */
export async function parsePDF(buffer: Buffer): Promise<PDFParseResult> {
  try {
    const data = await pdfParse(buffer);
    
    return {
      text: data.text,
      pageCount: data.numpages,
      metadata: {
        info: data.info,
        metadata: data.metadata,
        version: data.version,
      },
    };
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
