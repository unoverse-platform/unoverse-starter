/**
 * Card2 Node Executor
 * Auto-generated from Unoverse definition
 */

import { PromiseNode, type ValidationResult, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { Card2Config, Card2Output } from "../util/types";
import { loadDefaultTemplate } from "../service/templates";
import { publishComponent } from "../service/publishComponent";

export default class Card2Executor extends PromiseNode {
  constructor() {
    super("Card2");
  }

  protected async validateConfig(config: Card2Config): Promise<ValidationResult> {
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: Card2Config,
    context: NodeExecutionContext
  ): Promise<Card2Output> {
    // Pass config values to component. Unoverse props mirror the component's
    // definition exactly — only the declared props, nothing else (no node-level
    // config like Focus Mode). Include empty strings (for streaming text).
    const props: Record<string, any> = {};
    if (config.title !== undefined) {
      props.title = config.title;
    }
    if (config.description !== undefined) {
      props.description = config.description;
    }
    if (config.image !== undefined) {
      props.image = config.image;
    }
    if (config.callToAction !== undefined) {
      props.callToAction = config.callToAction;
    }

    // Aggregate `object` field: spread its declared keys over the named props
    // (object wins), so a single upstream object can populate the whole component.
    if (config.object && typeof config.object === "object") {
      for (const key of ["title", "description", "image", "callToAction"]) {
        if ((config.object as Record<string, any>)[key] !== undefined) {
          props[key] = (config.object as Record<string, any>)[key];
        }
      }
    }

    // Load template (just need componentUrl)
    const template = loadDefaultTemplate();

    // Generate ComponentSpec - minimal payload
    const componentSpec = {
      type: "Card2",
      version: "1.0.0",
      nodeId: context.nodeId, // Include nodeId at top level for client
      props,
      componentUrl: template.componentUrl,
      nodeSize: { width: 760, height: 320 },
      metadata: {
        dataSource: "direct",
        nodeId: context.nodeId,
        executionId: context.executionId,
      },
    };

    this.logger.info(`✅ [Card2] ComponentSpec generated for node: ${context.nodeId}`);

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
