/**
 * JourneyFinder Node Executor
 * Auto-generated from Unoverse definition
 */

import { PromiseNode, type ValidationResult, type NodeExecutionContext } from "@unoverse-platform/plugin-base";
import { JourneyFinderConfig, JourneyFinderOutput } from "../util/types";
import { loadDefaultTemplate } from "../service/templates";
import { publishComponent } from "../service/publishComponent";
import { awaitSubmission } from "../service/awaitSubmission";

export default class JourneyFinderExecutor extends PromiseNode {
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
    super("JourneyFinder");
  }

  protected async validateConfig(config: JourneyFinderConfig): Promise<ValidationResult> {
    return { success: true };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: JourneyFinderConfig,
    context: NodeExecutionContext
  ): Promise<JourneyFinderOutput> {
    // One log + one first-render marker per (execution, node) pair.
    const renderKey = `${context.executionId}:${context.nodeId}`;
    const firstRender = !JourneyFinderExecutor.loggedRenders.has(renderKey);
    if (firstRender) {
      if (JourneyFinderExecutor.loggedRenders.size > 10000) {
        JourneyFinderExecutor.loggedRenders.clear();
        JourneyFinderExecutor.lastPublished.clear();
      }
      JourneyFinderExecutor.loggedRenders.add(renderKey);
      this.logger.info(`✅ [JourneyFinder] ComponentSpec generated for node: ${context.nodeId}`);
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
    if (config.step !== undefined) {
      props.step = config.step;
    } else if (firstRender) {
      props.step = "";
    }
    if (config.searchStatus !== undefined) {
      props.searchStatus = config.searchStatus;
    } else if (firstRender) {
      props.searchStatus = "";
    }
    if (config.courses !== undefined) {
      props.courses = config.courses;
    }
    if (config.heroImage !== undefined) {
      props.heroImage = config.heroImage;
    } else if (firstRender) {
      props.heroImage = "";
    }

    // DELTA publish: only props whose value changed since the last publish of
    // this (execution, node) are sent. The first publish is the full baseline
    // (including the "" pins above); after that a thinking change never re-sends
    // text, a text chunk never re-sends thinking, and an execute that resolved
    // nothing new publishes nothing at all.
    const prev = JourneyFinderExecutor.lastPublished.get(renderKey);
    const changed: Record<string, any> = {};
    for (const [k, v] of Object.entries(props)) {
      if (!prev || JSON.stringify(prev[k]) !== JSON.stringify(v)) changed[k] = v;
    }
    JourneyFinderExecutor.lastPublished.set(renderKey, { ...(prev ?? {}), ...props });

    // Load template (just need componentUrl)
    const template = loadDefaultTemplate();

    // Generate ComponentSpec - minimal payload
    const componentSpec = {
      type: "JourneyFinder",
      version: "1.0.0",
      nodeId: context.nodeId, // Include nodeId at top level for client
      props: changed,
      componentUrl: template.componentUrl,
      nodeSize: { width: 1040, height: 760 },
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

    // This component opens in a non-default presentation mode (from its meta). Write that
    // MODE value into template state so the ACTIVE template renders its own surface for it
    // (template-local: chat = fluid overlay header→input, voice = right panel —
    // UNOVERSE_STATE_MODEL §5/§5a). We pass the mode VALUE — not a per-feature boolean — so
    // future modes branch with zero protocol change; the template reads `mode` via
    // Switch/visibleWhen. Generic TEMPLATE_DATA on the same publish lane.
    context.api?.getWebSocketManager?.()
      ?.get(context.publishingContext.userId, context.publishingContext.conversationId)
      ?.send(JSON.stringify({
        type: "TEMPLATE_DATA",
        chatId: context.publishingContext.chatId,
        conversationId: context.publishingContext.conversationId,
        userId: context.publishingContext.userId,
        workflowId: context.workflowId,
        workflowRunId: context.executionId,
        data: { mode: "focus" },
        timestamp: new Date().toISOString(),
      }));

    // ---- Declared component outputs — UNOVERSE_NODE_RUNTIME § Component outputs ----
    // WAIT for the user's submission (the data plane's user_action resolves this,
    // same process), then project ONLY the declared output keys. View-state
    // (step, progress…) never leaves the component.
    const OUTPUT_KEYS = ["careerStage","situation","subject","route","studyMode","commitment"];
    const submitted = await awaitSubmission(`${context.publishingContext.chatId}:${context.nodeId}`);
    const answers: Record<string, any> = {};
    for (const k of OUTPUT_KEYS) if (submitted[k] !== undefined) answers[k] = submitted[k];

    // The submission resolved — merge the NEUTRAL fact `submitted: true` into the
    // component's data (generic COMPONENT_DATA, same lane). The component's own
    // definition decides what a finished collector looks like (e.g. swap the working
    // animation for a compact done card). A fact, not a UX flag — the node never
    // names view states.
    context.api?.getWebSocketManager?.()
      ?.get(context.publishingContext.userId, context.publishingContext.conversationId)
      ?.send(JSON.stringify({
        type: "COMPONENT_DATA",
        chatId: context.publishingContext.chatId,
        conversationId: context.publishingContext.conversationId,
        userId: context.publishingContext.userId,
        nodeId: context.nodeId,
        workflowId: context.workflowId,
        workflowRunId: context.executionId,
        data: { submitted: true },
        timestamp: new Date().toISOString(),
      }));

    // The submission resolved — the component's work on its special surface is done and
    // the conversation takes over (the calling LLM continues with the answers). Hand the
    // surface BACK: clear the mode so the template returns to its default (inline)
    // rendering. Symmetric with the open-emit above; same generic TEMPLATE_DATA lane.
    context.api?.getWebSocketManager?.()
      ?.get(context.publishingContext.userId, context.publishingContext.conversationId)
      ?.send(JSON.stringify({
        type: "TEMPLATE_DATA",
        chatId: context.publishingContext.chatId,
        conversationId: context.publishingContext.conversationId,
        userId: context.publishingContext.userId,
        workflowId: context.workflowId,
        workflowRunId: context.executionId,
        data: { mode: "" },
        timestamp: new Date().toISOString(),
      }));

    return {
      __outputs: {
        output: answers,
      },
    };
  }
}
