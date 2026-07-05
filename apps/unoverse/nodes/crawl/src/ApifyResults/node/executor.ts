import { type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { ApifyResultsConfig, ApifyResultsState, ApifyResultsExecutorOutput, ApifyItem } from "../util/types";
import { CallbackNode, createLogger } from "../../shared/platform";
import { fetchApifyRunResults } from "../service/apifyService";
import { createHash } from "crypto";

const NODE_TYPE = "ApifyResults";

export class ApifyResultsExecutor extends CallbackNode<ApifyResultsConfig, ApifyResultsState> {
  constructor() {
    super(NODE_TYPE);
  }

  /**
   * Initialize state for ApifyResults
   */
  initializeState(inputs: any): ApifyResultsState & { isComplete?: boolean } {
    // Get resolved config from the executor (set by CallbackNodeActor)
    const config = (this as any).resolvedConfig as ApifyResultsConfig;

    return {
      items: [],
      currentIndex: 0,
      totalItems: 0,
      runId: config?.runId || "",
      isComplete: false,
    };
  }

  /**
   * Handle events and fetch/emit Apify results
   */
  async handleEvent(
    event: { type: string; inputs?: any; config?: any },
    state: ApifyResultsState & { isComplete?: boolean },
    emit: (output: any) => void
  ): Promise<ApifyResultsState & { isComplete?: boolean }> {
    const logger = createLogger("ApifyResults");
    const { inputs, config } = event;
    const resolvedConfig = config as ApifyResultsConfig;

    // Debug logging to understand input structure
    logger.info(`ApifyResults: Received event`, {
      eventType: event.type,
      inputs: inputs ? Object.keys(inputs) : [],
      config: config ? Object.keys(config) : [],
      hasRunId: !!resolvedConfig?.runId,
      runIdValue: resolvedConfig?.runId,
      stateItemsLength: state.items.length,
      isComplete: state.isComplete,
    });

    // If already complete, don't process any more events
    if (state.isComplete) {
      logger.info(`ApifyResults: Already completed, ignoring event`);
      return state;
    }

    // Check if this is a "continue" signal to advance iteration
    if (inputs?.continue !== undefined && state.items.length > 0) {
      logger.info(`ApifyResults: Received 'continue' signal`);

      // Check if we've exhausted all items
      if (state.currentIndex >= state.items.length) {
        logger.info(`ApifyResults: All items processed, marking complete`);
        return {
          ...state,
          isComplete: true,
        };
      }

      // Process next item
      const currentItem = state.items[state.currentIndex];
      const hasMore = state.currentIndex < state.items.length - 1;

      // Create a summary for logging
      const itemSummary = {
        url: currentItem.url || "No URL",
        status: currentItem.crawl?.httpStatusCode || "Unknown",
        depth: currentItem.crawl?.depth ?? "Unknown",
      };

      logger.info(`ApifyResults: Emitting item ${state.currentIndex + 1}/${state.items.length}`, {
        ...itemSummary,
        hasMore,
      });

      // Emit sanitized item
      const sanitizedItem = this.sanitizeItem(currentItem);

      emit({
        __outputs: {
          item: sanitizedItem,
          index: state.currentIndex,
          total: state.items.length,
          hasMore,
        },
      });

      // Return updated state
      return {
        ...state,
        currentIndex: state.currentIndex + 1,
        isComplete: state.currentIndex + 1 >= state.items.length,
      };
    }

    // If we haven't fetched items yet, fetch them
    if (state.items.length === 0 && resolvedConfig?.runId) {
      logger.info(`ApifyResults: Fetching results for run ${resolvedConfig.runId}`);

      try {
        // Get execution context from the executor (set by CallbackNodeActor)
        const executionContext = (this as any).executionContext;
        if (!executionContext) {
          throw new Error("Execution context not available");
        }
        const results = await fetchApifyRunResults(resolvedConfig.runId, executionContext);

        if (!results || !Array.isArray(results)) {
          logger.error(`ApifyResults: Invalid results from Apify`, {
            results: typeof results,
          });
          throw new Error("Invalid results from Apify API");
        }

        logger.info(`ApifyResults: Fetched ${results.length} items from Apify`);

        // If we have items, emit the first one immediately
        if (results.length > 0) {
          const firstItem = results[0];
          const sanitizedItem = this.sanitizeItem(firstItem);

          emit({
            __outputs: {
              item: sanitizedItem,
              index: 0,
              total: results.length,
              hasMore: results.length > 1,
            },
          });

          logger.info(`ApifyResults: Emitted first item (1/${results.length})`);
        }

        // Store items in state and mark first as already emitted
        return {
          ...state,
          items: results,
          totalItems: results.length,
          currentIndex: 1, // Start at 1 since we already emitted the first
          isComplete: results.length <= 1, // Complete if 0 or 1 items
        };
      } catch (error: any) {
        logger.error(`ApifyResults: Failed to fetch results`, {
          error: error instanceof Error ? error.message : "Unknown error",
          runId: resolvedConfig.runId,
        });
        throw error;
      }
    }

    // Default case: no action taken, just return current state
    logger.info(`ApifyResults: No action taken, waiting for continue signal`);
    return state;
  }

  /**
   * Sanitize Apify item to remove large fields that cause JSON parsing errors
   */
  private sanitizeItem(item: any): any {
    // Create a shallow copy and remove crawl
    const { crawl, ...itemWithoutCrawl } = item;
    const sanitized = { ...itemWithoutCrawl };

    // Remove headers from metadata if present
    if (sanitized.metadata) {
      const { headers, ...metadataWithoutHeaders } = sanitized.metadata;
      sanitized.metadata = metadataWithoutHeaders;
    }

    // Add universalId based on URL hash (first 12 chars of SHA256)
    if (sanitized.url) {
      const fullHash = createHash("sha256").update(sanitized.url).digest("hex");
      sanitized.universalId = fullHash.substring(0, 12);
    }

    // Create content hash using all available metadata and text
    const contentParts = [];

    // Add URL
    if (sanitized.url) contentParts.push(sanitized.url);

    // Add text content
    if (sanitized.text) contentParts.push(sanitized.text);

    // Add metadata fields
    if (sanitized.metadata) {
      if (sanitized.metadata.title) contentParts.push(sanitized.metadata.title);
      if (sanitized.metadata.description) contentParts.push(sanitized.metadata.description);
      if (sanitized.metadata.canonicalUrl) contentParts.push(sanitized.metadata.canonicalUrl);
      if (sanitized.metadata.author) contentParts.push(sanitized.metadata.author);
      if (sanitized.metadata.keywords) contentParts.push(sanitized.metadata.keywords);
      if (sanitized.metadata.languageCode) contentParts.push(sanitized.metadata.languageCode);

      // Add OpenGraph data if present
      if (sanitized.metadata.openGraph && Array.isArray(sanitized.metadata.openGraph)) {
        sanitized.metadata.openGraph.forEach((og: any) => {
          if (og.content) contentParts.push(og.content);
        });
      }
    }

    // Generate content hash from all parts
    if (contentParts.length > 0) {
      const contentString = contentParts.join("|");
      const contentHash = createHash("sha256").update(contentString).digest("hex");
      sanitized.contentId = contentHash.substring(0, 12);
    }

    return sanitized;
  }

  /**
   * Specify that 'continue' is a trigger input
   */
  protected getTriggerInputs(): string[] | null {
    return ["continue"];
  }

}
