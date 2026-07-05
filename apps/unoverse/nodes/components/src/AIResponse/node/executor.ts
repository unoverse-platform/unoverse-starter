/**
 * AIResponse Node Executor
 * Auto-generated from Unoverse definition
 */

import { PromiseNode, type ValidationResult, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { AIResponseConfig, AIResponseOutput } from "../util/types";
import { loadDefaultTemplate } from "../service/templates";
import { publishComponent } from "../service/publishComponent";

export default class AIResponseExecutor extends PromiseNode {
  // A design-system node re-executes once per streamed chunk, so an unguarded log
  // here floods the console (hundreds of identical lines per response). Track which
  // (execution, node) pairs we've already logged and emit ONE line per render — the
  // first. Static so it survives across the per-chunk re-instantiations. Soft-capped
  // so it can't grow unbounded in a long-lived node-service process.
  private static loggedRenders = new Set<string>();

  // Last published props per (execution, node) — publishes are DELTAS: only props
  // whose value changed since the previous publish are sent. Static so it survives
  // the per-chunk re-instantiations; soft-capped alongside loggedRenders.
  private static lastPublished = new Map<string, Record<string, any>>();

  constructor() {
    super("AIResponse");
  }

  protected async validateConfig(config: AIResponseConfig): Promise<ValidationResult> {
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: AIResponseConfig,
    context: NodeExecutionContext
  ): Promise<AIResponseOutput> {
    // One log + one first-render marker per (execution, node) pair.
    const renderKey = `${context.executionId}:${context.nodeId}`;
    const firstRender = !AIResponseExecutor.loggedRenders.has(renderKey);
    if (firstRender) {
      if (AIResponseExecutor.loggedRenders.size > 10000) {
        AIResponseExecutor.loggedRenders.clear();
        AIResponseExecutor.lastPublished.clear();
      }
      AIResponseExecutor.loggedRenders.add(renderKey);
      this.logger.info(`✅ [AIResponse] ComponentSpec generated for node: ${context.nodeId}`);
    }

    // Pass config values to component. Unoverse props mirror the component's
    // definition exactly — only the declared props, nothing else (no node-level
    // config like Focus Mode). Include empty strings (for streaming text).
    // On the FIRST publish of a run, unresolved STRING inputs are pinned to ""
    // so the client never falls back to the definition's preview defaults
    // mid-run (def defaults are workbench sample content, not production
    // content). Later publishes omit unresolved props, so the client-side
    // merge keeps already-streamed values.
    const props: Record<string, any> = {};
    if (config.thinking !== undefined) {
      props.thinking = config.thinking;
    } else if (firstRender) {
      props.thinking = "";
    }
    if (config.text !== undefined) {
      props.text = config.text;
    } else if (firstRender) {
      props.text = "";
    }
    if (config.questions !== undefined) {
      props.questions = config.questions;
    }

    // DELTA publish: only props whose value changed since the last publish of
    // this (execution, node) are sent. The first publish is the full baseline
    // (including the "" pins above); after that a thinking change never re-sends
    // text, a text chunk never re-sends thinking, and an execute that resolved
    // nothing new publishes nothing at all.
    const prev = AIResponseExecutor.lastPublished.get(renderKey);
    const changed: Record<string, any> = {};
    for (const [k, v] of Object.entries(props)) {
      if (!prev || JSON.stringify(prev[k]) !== JSON.stringify(v)) changed[k] = v;
    }
    AIResponseExecutor.lastPublished.set(renderKey, { ...(prev ?? {}), ...props });

    // Load template (just need componentUrl)
    const template = loadDefaultTemplate();

    // Generate ComponentSpec - minimal payload
    const componentSpec = {
      type: "AIResponse",
      version: "1.0.0",
      nodeId: context.nodeId, // Include nodeId at top level for client
      props: changed,
      componentUrl: template.componentUrl,
      nodeSize: { width: 750, height: 400 },
      metadata: {
        dataSource: "direct",
        nodeId: context.nodeId,
        executionId: context.executionId,
      },
    };

    // Publish component to client
    // Get publishing context from workflow execution (chatId, userId, etc.)
    if (!context.publishingContext) {
      throw new Error("Publishing context not available - cannot publish component");
    }

    // No changed props and not the first render → the client already has this
    // exact state; publishing again is pure noise. Skip.
    if (firstRender || Object.keys(changed).length > 0) {
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
    }

    return {
      __outputs: {
        componentSpec,
      },
    };
  }
}
