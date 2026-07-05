/**
 * Loop node implementation for GravityWorkflow
 *
 * State machine-based implementation that processes items one at a time.
 * Waits for continue signals to advance through the array.
 */

import { ValidationResult } from "@gravity-platform/plugin-base";
import { CallbackNode } from "../shared/platform";
import { LoopConfig } from "./utils/types";

interface LoopState {
  items: any[];
  currentIndex: number;
  isComplete: boolean;
  collectedItems: any[]; // Collected objects from each iteration
}

interface LoopInputs {
  items?: any[];
  next?: any;
}

interface LoopEvent {
  type: string;
  inputs?: LoopInputs;
  config?: LoopConfig;
}

export class LoopNode extends CallbackNode<LoopConfig, LoopState> {
  constructor() {
    super("Loop");
  }

  /**
   * Validate the Loop configuration
   */
  protected async validateConfig(config: LoopConfig): Promise<ValidationResult> {
    return { success: true };
  }

  /**
   * Initialize state for the loop
   */
  initializeState(inputs: any): LoopState {
    // Initialize with empty state - items will come from resolved config in handleEvent
    this.logger.info(`Loop: initializeState called`);
    return {
      items: [],
      currentIndex: 0,
      isComplete: false,
      collectedItems: [],
    };
  }

  /**
   * Handle events and update state
   */
  async handleEvent(event: LoopEvent, state: LoopState, emit: (output: any) => void): Promise<LoopState> {
    const { inputs, config } = event;
    const resolvedConfig = config as LoopConfig;

    // Log what we received
    this.logger.info(`Loop handleEvent called:`, {
      eventType: event.type,
      hasConfig: !!resolvedConfig,
      configItemsLength: resolvedConfig?.items?.length || 0,
      hasInputs: !!inputs,
      inputKeys: inputs ? Object.keys(inputs) : [],
      stateItemsLength: state.items.length,
      currentIndex: state.currentIndex,
    });

    // Handle different input signals independently

    // 1. Check if this is a "next" signal to advance iteration
    if (inputs?.next !== undefined) {
      this.logger.info(`Loop: Received 'next' signal`);

      // We need items in state to iterate
      if (!state.items || state.items.length === 0) {
        this.logger.warn(`Loop: Received 'next' but no items in state`);
        return state;
      }

      // Check if we've exhausted all items
      if (state.currentIndex >= state.items.length) {
        this.logger.info(`Loop: No more items to process, emitting finished signal`);

        // Build finished object with collected items if any
        const finishedOutput: any = { finished: true };

        if (state.collectedItems.length > 0) {
          finishedOutput.collected = state.collectedItems;
          this.logger.info(`Loop: Emitting ${state.collectedItems.length} collected items`);
        }

        emit({
          __outputs: {
            finished: finishedOutput,
          },
        });

        return {
          ...state,
          isComplete: true,
        };
      }

      // Process next item if available
      if (state.currentIndex < state.items.length) {
        const currentItem = state.items[state.currentIndex];
        const isLastItem = state.currentIndex === state.items.length - 1;

        this.logger.info(`Loop: Outputting item ${state.currentIndex}/${state.items.length - 1}`);

        // Check if we should collect items from this iteration
        let newCollectedItems = state.collectedItems;
        if (resolvedConfig?.collectItems && inputs?.next) {
          // The collectItems template should already be resolved to an object by the workflow engine
          const collectedItem = resolvedConfig.collectItems;
          if (collectedItem && typeof collectedItem === "object") {
            newCollectedItems = [...state.collectedItems, collectedItem];
            this.logger.info(`Loop: Collected item ${newCollectedItems.length}`);
          }
        }

        // Emit the item without finished signal
        emit({
          __outputs: {
            item: currentItem,
            index: state.currentIndex,
          },
        });

        return {
          ...state,
          currentIndex: state.currentIndex + 1,
          collectedItems: newCollectedItems,
          // Never mark complete here - only when next signal finds no more items
        };
      }
    }

    // 2. Check if we have items in state already (from previous SPAWN)
    if (state.items.length > 0) {
      this.logger.info(`Loop: Using ${state.items.length} items from state`);
    }
    // 3. Check if we got new items from config (resolved from SPAWN input)
    else if (resolvedConfig?.items !== undefined && Array.isArray(resolvedConfig.items)) {
      // New items arrived via config (resolved from SPAWN input), save to state
      this.logger.info(`Loop: Initialized with ${resolvedConfig.items.length} items from config`);

      // Save items to state for future events
      state = {
        ...state,
        items: resolvedConfig.items,
      };

      // Check if we have an empty array - immediately signal completion
      if (resolvedConfig.items.length === 0) {
        this.logger.info(`Loop: Received empty array, emitting finished signal`);

        emit({
          __outputs: {
            finished: {
              finished: true,
              collected: [], // Empty array if no items to process
            },
          },
        });

        return {
          items: resolvedConfig.items,
          currentIndex: 0,
          isComplete: true,
          collectedItems: [],
        };
      }

      // If we have items, emit the first one immediately
      if (resolvedConfig.items.length > 0) {
        const firstItem = resolvedConfig.items[0];
        const isLastItem = resolvedConfig.items.length === 1;

        this.logger.info(`Loop: Outputting first item (0/${resolvedConfig.items.length - 1})`);

        // Only emit the item, never finished with items
        emit({
          __outputs: {
            item: firstItem,
            index: 0,
          },
        });

        return {
          items: resolvedConfig.items,
          currentIndex: 1, // Start at 1 since we already emitted the first
          isComplete: false, // Never complete until we receive next with no more items
          collectedItems: [], // Start with empty collection
        };
      }
    }

    // If we don't have items yet, wait
    if (!state.items || state.items.length === 0) {
      this.logger.info("Loop: No items yet, waiting...");
      return state;
    }

    // If we've already processed all items, we're done
    if (state.currentIndex >= state.items.length) {
      this.logger.info(`Loop: Already completed`);
      return state;
    }

    // Default case: no specific signal received, just return current state
    this.logger.info(`Loop: No action taken, current index: ${state.currentIndex}/${state.items.length}`);
    return state;
  }

  /**
   * Cleanup any resources when the node is stopped
   */
  async cleanup(state: LoopState): Promise<void> {
    this.logger.info(`Loop: Cleaning up, processed ${state.currentIndex} of ${state.items.length} items`);
  }
}

export default LoopNode;
