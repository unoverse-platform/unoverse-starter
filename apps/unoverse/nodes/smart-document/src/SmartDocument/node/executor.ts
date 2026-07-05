import {
  getPlatformDependencies,
  type NodeExecutionContext,
} from "@gravity-platform/plugin-base";
import type {
  SmartDocumentConfig,
  SmartDocumentOutput,
  SectionLevel,
} from "../util/types";
import { getDoc, initDoc, keyFor } from "../service/markdownStore";
import { renderDoc } from "../service/mcpHandlers";
import {
  handleOutline,
  handleReadSection,
  handleUpdateSection,
  handleAppendToSection,
  handleReplaceInSection,
  handleInsertSection,
  handleDeleteSection,
  handleMoveSection,
  handleResetDoc,
} from "../service/mcpHandlers";
import { SmartDocumentMCPSchema } from "../service/mcpSchema";

const { PromiseNode, executeNodeWithRouting } = getPlatformDependencies();

const NODE_TYPE = "SmartDocument";

// Methods that mutate doc state → must emit NODE_OUTPUT via executeNodeWithRouting.
const MUTATING_METHODS = new Set([
  "updateSection",
  "appendToSection",
  "replaceInSection",
  "insertSection",
  "deleteSection",
  "moveSection",
  "resetDoc",
]);

// All supported MCP methods.
const KNOWN_METHODS = new Set([
  "getSchema",
  "outline",
  "readSection",
  "updateSection",
  "appendToSection",
  "replaceInSection",
  "insertSection",
  "deleteSection",
  "moveSection",
  "resetDoc",
]);

function resolveKey(context: NodeExecutionContext): string | null {
  // Scope the doc to user + workflow + conversation + node so it persists
  // across runs and chats (chatId is minted fresh per chat and would reset the
  // doc), while staying isolated per user, per workflow, per conversation, and
  // per node instance. conversationId on this platform tracks the workflow and
  // is reused across chats, so it falls back to workflowId when absent.
  const pubContext = (context as any).publishingContext || {};
  const workflowVars = (context as any).workflow?.variables || {};

  const userId = pubContext.userId || workflowVars.userId || "";
  const workflowId =
    (context as any).workflowId || (context as any).workflow?.id || "";
  const conversationId =
    pubContext.conversationId || workflowVars.conversationId || workflowId;
  const nodeId = context.nodeId;

  if (!userId || !workflowId || !nodeId) return null;
  return keyFor(userId, workflowId, conversationId, nodeId);
}

function sectionizeAt(config: SmartDocumentConfig): SectionLevel {
  return config?.sectionizeAt === 1 ? 1 : 2;
}

export default class SmartDocumentExecutor extends PromiseNode<SmartDocumentConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  /**
   * executeNode: produces the current rendered markdown as __outputs.markdown
   * so downstream nodes (MarkdownRenderer) receive the latest doc on every
   * NODE_OUTPUT. Used by both the graph-triggered path and by
   * executeNodeWithRouting from handleServiceCall.
   */
  protected async executeNode(
    _inputs: Record<string, any>,
    config: SmartDocumentConfig,
    context: NodeExecutionContext,
  ): Promise<SmartDocumentOutput> {
    const api = (context as any).api;
    const key = resolveKey(context);
    if (!key) {
      throw new Error(
        "SmartDocument requires userId + workflowId on the execution context to derive its state key",
      );
    }

    const level = sectionizeAt(config);
    await initDoc(api, key, config?.initialMarkdown ?? "", level);
    const doc = await getDoc(api, key, level);
    const markdown = doc ? renderDoc(doc) : "";

    this.logger.info(`📝 [SmartDocument] render — length=${markdown.length}`);

    return {
      __outputs: {
        markdown,
      },
    };
  }

  /**
   * MCP service interface.
   * - Read-only methods (outline, readSection) return data directly, no routing.
   * - Mutating methods apply the change, then call executeNodeWithRouting so
   *   downstream nodes re-fire with the fresh rendered markdown.
   */
  async handleServiceCall(
    method: string,
    params: any,
    config: SmartDocumentConfig,
    context: NodeExecutionContext,
  ): Promise<any> {
    const api = (context as any).api;

    if (method === "getSchema") {
      return SmartDocumentMCPSchema;
    }

    if (!KNOWN_METHODS.has(method)) {
      return {
        ok: false,
        error: "UNKNOWN_METHOD",
        hint: `Unknown method '${method}'. Available: ${Array.from(KNOWN_METHODS).filter((m) => m !== "getSchema").join(", ")}.`,
      };
    }

    const key = resolveKey(context);
    if (!key) {
      return {
        ok: false,
        error: "NOT_INITIALISED",
        hint: "SmartDocument has no userId/workflowId on the execution context.",
      };
    }

    const level = sectionizeAt(config);
    await initDoc(api, key, config?.initialMarkdown ?? "", level);

    let mcpResult: any;
    switch (method) {
      case "outline":
        mcpResult = await handleOutline(api, key, level);
        break;
      case "readSection":
        mcpResult = await handleReadSection(api, key, params || {}, level);
        break;
      case "updateSection":
        mcpResult = await handleUpdateSection(api, key, params || {}, level);
        break;
      case "appendToSection":
        mcpResult = await handleAppendToSection(api, key, params || {}, level);
        break;
      case "replaceInSection":
        mcpResult = await handleReplaceInSection(api, key, params || {}, level);
        break;
      case "insertSection":
        mcpResult = await handleInsertSection(api, key, params || {}, level);
        break;
      case "deleteSection":
        mcpResult = await handleDeleteSection(api, key, params || {}, level);
        break;
      case "moveSection":
        mcpResult = await handleMoveSection(api, key, params || {}, level);
        break;
      case "resetDoc":
        mcpResult = await handleResetDoc(
          api,
          key,
          config?.initialMarkdown ?? "",
          level,
        );
        break;
      default:
        return {
          ok: false,
          error: "UNKNOWN_METHOD",
          hint: `Unknown method '${method}'.`,
        };
    }

    // Hybrid contract: a MUTATION emits NODE_OUTPUT with the rendered doc so the
    // renderer stays in sync with server state. Read-only calls (outline,
    // readSection) do NOT change the doc, so they must NOT re-render — re-rendering
    // on reads re-emitted the full document on every navigation call and flooded
    // the renderer / traces (the MUTATING_METHODS guard exists for exactly this; it
    // was previously unused, so every call re-fired).
    if (MUTATING_METHODS.has(method)) {
      try {
        if (typeof executeNodeWithRouting === "function") {
          await executeNodeWithRouting(
            this.executeNode.bind(this),
            {},
            config,
            context,
          );
        }
      } catch (err: any) {
        this.logger.error(
          `[SmartDocument] executeNodeWithRouting failed: ${err?.message}`,
        );
      }
    }

    return mcpResult;
  }
}

export { SmartDocumentMCPSchema };
