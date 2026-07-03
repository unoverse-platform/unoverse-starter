/**
 * TrendChart Node Executor
 * Auto-generated from Storybook component
 */

import { PromiseNode, type ValidationResult, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { TrendChartConfig, TrendChartOutput } from "../util/types";
import { loadDefaultTemplate } from "../service/templates";
import { publishComponent } from "../service/publishComponent";

export default class TrendChartExecutor extends PromiseNode {
  constructor() {
    super("TrendChart");
  }

  protected async validateConfig(config: TrendChartConfig): Promise<ValidationResult> {
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: TrendChartConfig,
    context: NodeExecutionContext
  ): Promise<TrendChartOutput> {
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
    if (config.data !== undefined) {
      props.data = config.data;
    }
    if (config.series !== undefined) {
      props.series = config.series;
    }
    if (config.labels !== undefined) {
      props.labels = config.labels;
    }
    if (config.title !== undefined) {
      props.title = config.title;
    }
    if (config.color !== undefined) {
      props.color = config.color;
    }
    if (config.area !== undefined) {
      props.area = config.area;
    }
    if (config.showDots !== undefined) {
      props.showDots = config.showDots;
    }
    if (config.yMin !== undefined) {
      props.yMin = config.yMin;
    }
    if (config.yMax !== undefined) {
      props.yMax = config.yMax;
    }
    if (config.valuePrefix !== undefined) {
      props.valuePrefix = config.valuePrefix;
    }
    if (config.valueSuffix !== undefined) {
      props.valueSuffix = config.valueSuffix;
    }

    // Load template (just need componentUrl)
    const template = loadDefaultTemplate();

    // Generate ComponentSpec - minimal payload
    const componentSpec = {
      type: "TrendChart",
      version: "1.0.0",
      nodeId: context.nodeId, // Include nodeId at top level for client
      props,
      componentUrl: template.componentUrl,
      nodeSize: { width: 640, height: 380 },
      metadata: {
        dataSource: "direct",
        nodeId: context.nodeId,
        executionId: context.executionId,
      },
    };

    this.logger.info(`✅ [TrendChart] ComponentSpec generated for node: ${context.nodeId}`);

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
