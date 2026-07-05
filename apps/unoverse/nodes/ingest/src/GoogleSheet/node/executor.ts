import { type NodeExecutionContext } from "@unoverse-platform/plugin-base";
import { GoogleSheetConfig, GoogleSheetState, GoogleSheetExecutorOutput } from "../util/types";
import { CallbackNode, createLogger } from "../../shared/platform";
import { readGoogleSheet } from "../service/googleSheetsService";

type GoogleSheetEvent = {
  type: "EXECUTE" | "CONTINUE";
  inputs?: any;
};

const NODE_TYPE = "GoogleSheet";

export class GoogleSheetExecutor extends CallbackNode<GoogleSheetConfig, GoogleSheetState> {
  constructor() {
    super(NODE_TYPE);
  }

  initializeState(inputs: any): GoogleSheetState {
    return {
      sheetData: null,
      currentIndex: 0,
      headers: undefined,
      isComplete: false
    };
  }

  async handleEvent(
    event: GoogleSheetEvent,
    state: GoogleSheetState,
    emit: (output: any) => void
  ): Promise<GoogleSheetState> {
    const logger = createLogger("GoogleSheet");
    
    // If already complete, return current state
    if (state.isComplete) {
      return state;
    }

    const config = (event.inputs as any)?.config || {};
    const { spreadsheetId, range = "Sheet1", useHeaders = true } = config;
    
    logger.info(`GoogleSheet: Handling event`, {
      eventType: event.type,
      spreadsheetId,
      range,
      useHeaders,
      hasSheetData: !!state.sheetData,
      currentIndex: state.currentIndex
    });

    // If we don't have sheet data yet, fetch it
    if (!state.sheetData) {
      // Build credential context for the service
      const credentialContext = this.buildCredentialContext(event as any);

      try {
        // Fetch the sheet data
        logger.info(`GoogleSheet: Fetching data from Google Sheets`, { spreadsheetId });
        const sheetsData = await readGoogleSheet(spreadsheetId, range, credentialContext);
        const values = sheetsData.values || [];

        if (values.length === 0) {
          emit({
            __outputs: {
              item: [],
              index: 0,
              total: 0,
              hasMore: false,
            }
          });
          return {
            ...state,
            isComplete: true
          };
        }

        let processedData: any[];
        let headers: string[] | undefined;

        // Process headers if needed
        if (useHeaders && values.length > 1) {
          headers = values[0].map((header, index) => 
            header ? String(header) : `Column${index + 1}`
          );
          
          // Convert remaining rows to objects
          processedData = values.slice(1).map(row => {
            const obj: any = {};
            headers!.forEach((header, index) => {
              obj[header] = row[index] !== undefined ? row[index] : null;
            });
            return obj;
          });
        } else {
          // Use raw arrays
          processedData = values;
        }

        logger.info(`GoogleSheet: Sheet data loaded`, {
          totalRows: processedData.length,
          hasHeaders: !!headers
        });

        // Update state with fetched data
        state = {
          ...state,
          sheetData: processedData,
          headers: headers
        };
      } catch (error: any) {
        logger.error(`GoogleSheet: Failed to fetch sheet data`, {
          error: error.message,
          spreadsheetId
        });
        
        emit({
          __outputs: {
            item: null,
            index: 0,
            total: 0,
            hasMore: false,
            error: error.message
          }
        });
        
        return {
          ...state,
          isComplete: true
        };
      }
    }

    // Process current item
    if (state.sheetData && state.currentIndex < state.sheetData.length) {
      const item = state.sheetData[state.currentIndex];
      const hasMore = state.currentIndex < state.sheetData.length - 1;
      
      logger.info(`GoogleSheet: Emitting item ${state.currentIndex + 1}/${state.sheetData.length}`, {
        index: state.currentIndex,
        total: state.sheetData.length,
        hasMore
      });

      emit({
        __outputs: {
          item: item,
          index: state.currentIndex,
          total: state.sheetData.length,
          hasMore: hasMore
        }
      });

      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        isComplete: !hasMore
      };
    }

    // No more items
    return {
      ...state,
      isComplete: true
    };
  }

  /**
   * Specify that 'continue' is a trigger input when looping is enabled
   */
  protected getTriggerInputs(): string[] | null {
    return ["continue"];
  }

  /**
   * Build credential context from execution context
   */
  private buildCredentialContext(context: NodeExecutionContext) {
    return {
      credentials: context.credentials || {},
      nodeType: NODE_TYPE,
      workflowId: context.workflow?.id || "",
      executionId: context.executionId || "",
      nodeId: context.nodeId || "",
    };
  }
}
