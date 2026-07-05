/**
 * StatCard Node Executor
 * Auto-generated from Unoverse definition
 */

import { PromiseNode, type ValidationResult, type NodeExecutionContext } from "@unoverse-platform/plugin-base";
import { StatCardConfig, StatCardOutput } from "../util/types";
import { loadDefaultTemplate } from "../service/templates";
import { publishComponent } from "../service/publishComponent";

export default class StatCardExecutor extends PromiseNode {
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
    // One log + one first-render marker per (execution, node) pair.
    const renderKey = `${context.executionId}:${context.nodeId}`;
    const firstRender = !StatCardExecutor.loggedRenders.has(renderKey);
    if (firstRender) {
      if (StatCardExecutor.loggedRenders.size > 10000) {
        StatCardExecutor.loggedRenders.clear();
        StatCardExecutor.lastPublished.clear();
      }
      StatCardExecutor.loggedRenders.add(renderKey);
      this.logger.info(`✅ [StatCard] ComponentSpec generated for node: ${context.nodeId}`);
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
    if (config.label !== undefined) {
      props.label = config.label;
    } else if (firstRender) {
      props.label = "";
    }
    if (config.value !== undefined) {
      props.value = config.value;
    } else if (firstRender) {
      props.value = "";
    }
    if (config.deltaArrow !== undefined) {
      props.deltaArrow = config.deltaArrow;
    } else if (firstRender) {
      props.deltaArrow = "";
    }
    if (config.deltaValue !== undefined) {
      props.deltaValue = config.deltaValue;
    } else if (firstRender) {
      props.deltaValue = "";
    }
    if (config.deltaLabel !== undefined) {
      props.deltaLabel = config.deltaLabel;
    } else if (firstRender) {
      props.deltaLabel = "";
    }
    if (config.deltaPositive !== undefined) {
      props.deltaPositive = config.deltaPositive;
    }
    if (config.deltaNegative !== undefined) {
      props.deltaNegative = config.deltaNegative;
    }
    if (config.deltaNeutral !== undefined) {
      props.deltaNeutral = config.deltaNeutral;
    }
    if (config.trend !== undefined) {
      props.trend = config.trend;
    }

    // DELTA publish: only props whose value changed since the last publish of
    // this (execution, node) are sent. The first publish is the full baseline
    // (including the "" pins above); after that a thinking change never re-sends
    // text, a text chunk never re-sends thinking, and an execute that resolved
    // nothing new publishes nothing at all.
    const prev = StatCardExecutor.lastPublished.get(renderKey);
    const changed: Record<string, any> = {};
    for (const [k, v] of Object.entries(props)) {
      if (!prev || JSON.stringify(prev[k]) !== JSON.stringify(v)) changed[k] = v;
    }
    StatCardExecutor.lastPublished.set(renderKey, { ...(prev ?? {}), ...props });

    // Load template (just need componentUrl)
    const template = loadDefaultTemplate();

    // Generate ComponentSpec - minimal payload
    const componentSpec = {
      type: "StatCard",
      version: "1.0.0",
      nodeId: context.nodeId, // Include nodeId at top level for client
      props: changed,
      componentUrl: template.componentUrl,
      nodeSize: { width: 360, height: 260 },
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
