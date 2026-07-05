import { type NodeExecutionContext } from "@unoverse-platform/plugin-base";
import { DocumentConfig, DocumentInput, DocumentOutput, DocumentExecutorOutput, CachedDocument } from "../util/types";
import { CallbackNode, createLogger } from "../../shared/platform";
import { DocumentCacheService } from "../service/documentCache";

interface DocumentState {
  document: CachedDocument | null;
  isComplete: boolean;
}

type DocumentEvent = {
  type: "EXECUTE" | "CONTINUE";
  inputs?: DocumentInput;
};

const NODE_TYPE = "Document";

export class DocumentExecutor extends CallbackNode<DocumentConfig, DocumentState> {
  private cacheService = new DocumentCacheService();
  
  constructor() {
    super(NODE_TYPE);
  }

  initializeState(inputs: DocumentInput): DocumentState {
    return {
      document: null,
      isComplete: false
    };
  }

  async handleEvent(
    event: DocumentEvent,
    state: DocumentState,
    emit: (output: any) => void
  ): Promise<DocumentState> {
    const logger = createLogger("Document");
    
    // If already complete, return current state
    if (state.isComplete) {
      return state;
    }

    const config = (event.inputs as any)?.config || {};
    const maxFileSizeMB = config.maxFileSizeMB || 50;

    logger.info("Document Cache Node Started (Single Document)", {
      maxFileSizeMB,
      alwaysLoad: true,
    });

    // Process document from config if provided
    if (config.file) {
      const result = await this.cacheService.handleDocument(config.file, maxFileSizeMB);
      if (result.output) {
        emit({
          __outputs: {
            output: result.output,
          },
        });
      }
      return {
        document: result.document,
        isComplete: true
      };
    } else {
      // No document configured
      emit({
        __outputs: {
          output: {
            operation: "error",
            documentId: "none",
            metadata: { key: "none", size: 0 },
            error: "No document configured",
            cacheStats: {
              totalCached: 0,
              memoryUsedMB: 0,
              cacheHits: 0,
              cacheMisses: 0,
            },
          },
        },
      });
      return {
        ...state,
        isComplete: true
      };
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
