/// <reference path="../util/pdf-parse.d.ts" />

import { type NodeExecutionContext } from "@unoverse-platform/plugin-base";
import { DocumentParserConfig, DocumentParserOutput, DocumentParserExecutorOutput } from "../util/types";
import { PromiseNode, createLogger } from "../../shared/platform";
import { 
  parsePDF, 
  parseDOCX, 
  parseTXT, 
  detectFileType, 
  isSupportedFileType,
  FileType 
} from "../service";
import { createContentHash } from "../util/hashUtils";

const NODE_TYPE = "DocumentParser";

export class DocumentParserExecutor extends PromiseNode<DocumentParserConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: DocumentParserConfig,
    context: NodeExecutionContext
  ): Promise<DocumentParserExecutorOutput> {
    const logger = createLogger("DocumentParser");
    const file = config.file;

    // Enhanced debugging
    logger.info('DocumentParser executeNode - comprehensive debug:', {
      nodeId: context.nodeId,
      configFile: file,
      configKeys: Object.keys(config),
      inputsKeys: Object.keys(inputs || {}),
      contextInputs: inputs,
      contextInputsKeys: inputs ? Object.keys(inputs) : [],
      contextHasLoop1: !!(inputs && inputs.loop1),
      loop1Output: inputs && inputs.loop1
    });

    // Validate input
    if (!file) {
      throw new Error('No file input provided');
    }

    // Validate file object has required properties
    if (!file.key || (!file.content && !file.downloadUrl)) {
      throw new Error('Invalid file input: missing key and both content and downloadUrl properties');
    }

    logger.info('Starting document parsing', { 
      fileKey: file.key,
      fileSize: file.size,
      parserType: config.parserType || 'auto'
    });

    // Check file size limit
    const maxSizeBytes = (config.maxFileSizeMB || 10) * 1024 * 1024;
    if (file.size && file.size > maxSizeBytes) {
      throw new Error(`File size (${file.size} bytes) exceeds maximum allowed size (${maxSizeBytes} bytes)`);
    }

    // Get content either from file.content or by fetching from downloadUrl
    let documentBuffer: Buffer;
    
    if (file.content) {
      // Use provided content (base64 or Buffer)
      if (Buffer.isBuffer(file.content)) {
        documentBuffer = file.content;
      } else if (typeof file.content === 'string') {
        // Assume base64 encoded
        documentBuffer = Buffer.from(file.content, 'base64');
      } else {
        throw new Error('Invalid file content: must be Buffer or base64 string');
      }
    } else if (file.downloadUrl) {
      // Fetch content from downloadUrl to avoid large payloads in subscriptions
      logger.info('Fetching document from downloadUrl', { downloadUrl: file.downloadUrl });
      
      try {
        const response = await fetch(file.downloadUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        documentBuffer = Buffer.from(arrayBuffer);
        
        logger.info('Successfully fetched document from downloadUrl', { 
          downloadUrl: file.downloadUrl,
          fetchedSize: documentBuffer.length 
        });
      } catch (error: any) {
        logger.error('Failed to fetch document from downloadUrl', { 
          downloadUrl: file.downloadUrl,
          error: error.message 
        });
        throw new Error(`Failed to fetch document from downloadUrl: ${error.message}`);
      }
    } else {
      throw new Error('Neither content nor downloadUrl provided');
    }

    // Determine parser type
    let parserType: string = config.parserType || 'auto';
    if (parserType === 'auto') {
      const detectedType = detectFileType(file.key);
      if (!isSupportedFileType(detectedType)) {
        throw new Error(`Unsupported file type for file: ${file.key}`);
      }
      // Use the detected type directly
      parserType = detectedType;
    }

    // Parse document based on type
    let result: DocumentParserOutput;
    
    try {
      switch (parserType) {
        case FileType.PDF:
        case 'pdf': {
          const pdfResult = await parsePDF(documentBuffer);
          result = {
            fileKey: file.key,
            text: pdfResult.text,
            pageCount: pdfResult.pageCount,
            metadata: pdfResult.metadata,
            fileType: 'pdf',
            fileSize: documentBuffer.length,
            bucket: file.bucket,
            universalId: file.universalId,
            downloadUrl: file.downloadUrl,
          };
          
          // Add content hash for change detection
          result.contentId = createContentHash(result);
          break;
        }
        
        case FileType.DOCX:
        case 'docx': {
          const docxResult = await parseDOCX(documentBuffer);
          result = {
            fileKey: file.key,
            text: docxResult.text,
            pageCount: 1, // DOCX doesn't provide page count
            metadata: {
              html: docxResult.html,
              messages: docxResult.messages,
            },
            fileType: 'docx',
            fileSize: documentBuffer.length,
            bucket: file.bucket,
            universalId: file.universalId,
            downloadUrl: file.downloadUrl,
          };
          
          // Add content hash for change detection
          result.contentId = createContentHash(result);
          break;
        }
        
        case FileType.TXT:
        case 'txt': {
          const txtResult = await parseTXT(documentBuffer);
          result = {
            fileKey: file.key,
            text: txtResult.text,
            pageCount: 1,
            metadata: {
              encoding: txtResult.encoding,
            },
            fileType: 'txt',
            fileSize: documentBuffer.length,
            bucket: file.bucket,
            universalId: file.universalId,
            downloadUrl: file.downloadUrl,
          };
          
          // Add content hash for change detection
          result.contentId = createContentHash(result);
          break;
        }
        
        default:
          throw new Error(`Unsupported parser type: ${parserType}`);
      }
      
      logger.info('Document parsed successfully', {
        fileKey: file.key,
        fileType: result.fileType,
        textLength: result.text.length,
        pageCount: result.pageCount,
      });
      
      // Wrap in __outputs pattern
      return {
        __outputs: {
          output: result
        }
      };
    } catch (error) {
      logger.error('Document parsing failed', {
        fileKey: file.key,
        parserType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Build credential context from execution context
   */
  private buildCredentialContext(context: NodeExecutionContext) {
    return {
      credentials: {
        aws: context.credentials?.awsCredential || {},
      },
      nodeType: NODE_TYPE,
      workflowId: context.workflow?.id || "",
      executionId: context.executionId || "",
      nodeId: context.nodeId || "",
    };
  }
}
