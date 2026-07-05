/**
 * Note Node Executor
 * A simple pass-through node that serves as documentation
 */

import { NodeExecutionContext, ValidationResult } from "@unoverse-platform/plugin-base";
import { PromiseNode } from "../shared/platform";

interface NoteConfig {
  content: string;
  backgroundColor?: string;
  fontSize?: number;
}

export default class NoteExecutor extends PromiseNode {
  async executeNode(
    inputs: Record<string, any>,
    config: NoteConfig,
    context: NodeExecutionContext
  ): Promise<Record<string, any>> {
    // Note nodes are purely for documentation
    // They don't process any data, just display markdown content
    this.logger.info("Note node executing", { 
      contentLength: config.content?.length || 0 
    });
    
    // Return empty object since Note nodes have no outputs
    return {};
  }
}
