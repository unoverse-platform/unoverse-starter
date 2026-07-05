/**
 * Type definitions for Loop node
 */

// Input - accepts array and optional continue trigger
export interface LoopInput {
  items?: any[]; // Array of items to iterate over (first execution)
  continue?: boolean; // Trigger to continue to next item
}

// Output - current item and loop metadata
export interface LoopOutput {
  item: any; // Current item being processed
}

// Loop metadata included in output
export interface LoopMetadata {
  index: number; // Current item index
  total: number; // Total number of items
  hasMore: boolean; // Whether there are more items to process
  complete: boolean; // Whether the loop is complete
}

// Internal state - no longer needed with the simpler implementation
export interface LoopState {
  // State is now managed with instance variables in the executor
}

// Config - receives data from upstream nodes via templates
export interface LoopConfig {
  items?: any[];        // Array from upstream nodes (EXECUTE signal on 'items' connector)
  continue?: any;       // Continue trigger (EXECUTE signal on 'continue' connector)
  collectItems?: string; // Optional template to collect objects from each iteration
}
