/**
 * StatCard Node Executor
 * Auto-generated from Storybook component
 */

import { PromiseNode, type ValidationResult, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { StatCardConfig, StatCardOutput } from "../util/types";
import { loadDefaultTemplate } from "../service/templates";
import { publishComponent } from "../service/publishComponent";

export default class StatCardExecutor extends PromiseNode {
  constructor() {
    super("StatCard");
  }

  protected async validateConfig(config: StatCardConfig): Promise<ValidationResult> {
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: StatCardConfig,
    context: NodeExecutionContext
  ): Promise<StatCardOutput> {
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
    if (config.label !== undefined) {
      props.label = config.label;
    }
    if (config.value !== undefined) {
      props.value = config.value;
    }
    if (config.prefix !== undefined) {
      props.prefix = config.prefix;
    }
    if (config.suffix !== undefined) {
      props.suffix = config.suffix;
    }
    if (config.delta !== undefined) {
      props.delta = config.delta;
    }
    if (config.invertDelta !== undefined) {
      props.invertDelta = config.invertDelta;
    }
    if (config.sparkline !== undefined) {
      props.sparkline = config.sparkline;
    }
    if (config.icon !== undefined) {
      props.icon = config.icon;
    }
    if (config.caption !== undefined) {
      props.caption = config.caption;
    }
    if (config.accentColor !== undefined) {
      props.accentColor = config.accentColor;
    }

    // Load template (just need componentUrl)
    const template = loadDefaultTemplate();

    // Generate ComponentSpec - minimal payload
    const componentSpec = {
      type: "StatCard",
      version: "1.0.0",
      nodeId: context.nodeId, // Include nodeId at top level for client
      props,
      componentUrl: template.componentUrl,
      nodeSize: { width: 320, height: 200 },
      metadata: {
        dataSource: "direct",
        nodeId: context.nodeId,
        executionId: context.executionId,
      },
    };

    this.logger.info(`✅ [StatCard] ComponentSpec generated for node: ${context.nodeId}`);

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
