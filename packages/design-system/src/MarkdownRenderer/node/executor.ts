/**
 * MarkdownRenderer Node Executor
 * Auto-generated from Storybook component
 */

import { PromiseNode, type ValidationResult, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { MarkdownRendererConfig, MarkdownRendererOutput } from "../util/types";
import { loadDefaultTemplate } from "../service/templates";
import { publishComponent } from "../service/publishComponent";

export default class MarkdownRendererExecutor extends PromiseNode {
  constructor() {
    super("MarkdownRenderer");
  }

  protected async validateConfig(config: MarkdownRendererConfig): Promise<ValidationResult> {
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: MarkdownRendererConfig,
    context: NodeExecutionContext
  ): Promise<MarkdownRendererOutput> {
    // Pass config values to component
    // Include all defined props, even empty strings (for streaming text)
    const props: Record<string, any> = {};
    
    // Always pass focusable and focusLabel (universal Focus Mode config)
    if (config.focusable !== undefined) {
      props.focusable = config.focusable;
    }
    if (config.focusLabel !== undefined) {
      props.focusLabel = config.focusLabel;
    }
    if (config.title !== undefined) {
      props.title = config.title;
    }
    if (config.markdown !== undefined) {
      props.markdown = config.markdown;
    }
    if (config.streamingState !== undefined) {
      props.streamingState = config.streamingState;
    }

    // Load template (just need componentUrl)
    const template = loadDefaultTemplate();

    // Generate ComponentSpec - minimal payload
    const componentSpec = {
      type: "MarkdownRenderer",
      version: "1.0.0",
      nodeId: context.nodeId, // Include nodeId at top level for client
      props,
      componentUrl: template.componentUrl,
      metadata: {
        dataSource: "direct",
        nodeId: context.nodeId,
        executionId: context.executionId,
      },
    };

    this.logger.info(`✅ [MarkdownRenderer] ComponentSpec generated for node: ${context.nodeId}`);

    // Publish component to client
    // Get publishing context from workflow execution (chatId, userId, etc.)
    if (!context.publishingContext) {
      throw new Error("Publishing context not available - cannot publish component");
    }
    
    await publishComponent(
      {
        component: componentSpec,
        chatId: context.publishingContext.chatId,
        conversationId: context.publishingContext.conversationId,
        userId: context.publishingContext.userId,
        providerId: context.publishingContext.providerId,
        workflowId: context.workflowId,
        workflowRunId: context.executionId,
        nodeId: context.nodeId,
        targetTriggerNode: context.publishingContext.targetTriggerNode, // For Focus Mode routing
      },
      context.api,
      context // Pass full context for workflow state access
    );

    return {
      __outputs: {
        componentSpec,
      },
    };
  }
}
