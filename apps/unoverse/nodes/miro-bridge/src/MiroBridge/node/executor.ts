import {
  getPlatformDependencies,
  type NodeExecutionContext,
} from "@unoverse-platform/plugin-base";
import type { MiroBridgeConfig, MiroBridgeOutput } from "../util/types";
import { MiroBridgeMCPSchema } from "../service/mcpSchema";
import {
  handleGetBoardState,
  handleGetSelection,
  handleCreateSticky,
  handleCreateText,
  handleCreateFrame,
  handleCreateCard,
  handleCreateAppCard,
  handleCreateImage,
  handleUpdateItem,
  handleDeleteItem,
  handleCreateConnector,
  handleAddTag,
  handleZoomTo,
  handleCreateDiagram,
} from "../service/mcpHandlers";
import { keyFor, getBoard } from "../service/boardStore";
import { normaliseParams } from "../service/normalise";

const { PromiseNode, executeNodeWithRouting } = getPlatformDependencies();

const NODE_TYPE = "MiroBridge";

// Read operations — do NOT re-emit NODE_OUTPUT after these.
const READ_ONLY_METHODS = new Set(["get_board_state", "get_selection"]);

const KNOWN_METHODS = new Set([
  "getSchema",
  "get_board_state",
  "get_selection",
  "create_sticky",
  "create_text",
  "create_frame",
  "create_card",
  "create_app_card",
  "create_image",
  "update_item",
  "delete_item",
  "create_connector",
  "add_tag",
  "zoom_to",
  "create_diagram",
]);

function resolveKey(context: NodeExecutionContext): string | null {
  const chatId =
    (context as any).publishingContext?.chatId ??
    (context as any).chatId ??
    null;
  if (!chatId) return null;
  return keyFor(chatId, context.nodeId);
}

export default class MiroBridgeExecutor extends PromiseNode<MiroBridgeConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  /**
   * Workflow channel: fires on graph trigger.
   * Returns whatever board state is cached in Redis (or empty if not yet fetched).
   * The LLM should call get_board_state via MCP to get the live snapshot.
   */
  protected async executeNode(
    _inputs: Record<string, any>,
    config: MiroBridgeConfig,
    context: NodeExecutionContext,
  ): Promise<MiroBridgeOutput> {
    const api = (context as any).api;
    const key = resolveKey(context);
    const cached = key ? await getBoard(api, key) : null;

    return {
      __outputs: {
        boardState: cached ?? { items: [], connectors: [], tags: [], version: 0, updatedAt: new Date().toISOString() },
      },
    };
  }

  /**
   * MCP channel: called by connected LLM nodes.
   * Reads wait for the browser. Writes update Redis and fire-and-forget to the browser.
   */
  async handleServiceCall(
    method: string,
    params: any,
    config: MiroBridgeConfig,
    context: NodeExecutionContext,
  ): Promise<any> {
    if (method === "getSchema") return MiroBridgeMCPSchema;

    if (!KNOWN_METHODS.has(method)) {
      return {
        ok: false,
        error: "UNKNOWN_METHOD",
        hint: `Unknown method '${method}'. Available: ${Array.from(KNOWN_METHODS).filter((m) => m !== "getSchema").join(", ")}.`,
      };
    }

    const api = (context as any).api;
    const credentialContext = this.getExecutionContext(context);
    const normalisedParams = normaliseParams(params ?? {});

    let mcpResult: any;
    try {
      switch (method) {
        case "get_board_state":   mcpResult = await handleGetBoardState(normalisedParams, config, context, api, credentialContext); break;
        case "get_selection":     mcpResult = await handleGetSelection(normalisedParams, config, context, api, credentialContext); break;
        case "create_sticky":     mcpResult = await handleCreateSticky(normalisedParams, config, context, api, credentialContext); break;
        case "create_text":       mcpResult = await handleCreateText(normalisedParams, config, context, api, credentialContext); break;
        case "create_frame":      mcpResult = await handleCreateFrame(normalisedParams, config, context, api, credentialContext); break;
        case "create_card":       mcpResult = await handleCreateCard(normalisedParams, config, context, api, credentialContext); break;
        case "create_app_card":   mcpResult = await handleCreateAppCard(normalisedParams, config, context, api, credentialContext); break;
        case "create_image":      mcpResult = await handleCreateImage(normalisedParams, config, context, api, credentialContext); break;
        case "update_item":       mcpResult = await handleUpdateItem(normalisedParams, config, context, api, credentialContext); break;
        case "delete_item":       mcpResult = await handleDeleteItem(normalisedParams, config, context, api, credentialContext); break;
        case "create_connector":  mcpResult = await handleCreateConnector(normalisedParams, config, context, api, credentialContext); break;
        case "add_tag":           mcpResult = await handleAddTag(normalisedParams, config, context, api, credentialContext); break;
        case "zoom_to":           mcpResult = await handleZoomTo(normalisedParams, config, context, api, credentialContext); break;
        case "create_diagram":    mcpResult = await handleCreateDiagram(normalisedParams, config, context, api, credentialContext); break;
        default: return { ok: false, error: "UNKNOWN_METHOD", hint: `Unknown method '${method}'.` };
      }
    } catch (err: any) {
      return {
        ok: false,
        error: "EXECUTION_ERROR",
        hint: err?.message ?? "Unknown error",
      };
    }

    // Re-emit updated board state to the workflow after every write.
    if (!READ_ONLY_METHODS.has(method)) {
      try {
        if (typeof executeNodeWithRouting === "function") {
          await executeNodeWithRouting(this.executeNode.bind(this), {}, config, context);
        }
      } catch (err: any) {
        this.logger.error(`[MiroBridge] executeNodeWithRouting failed: ${err?.message}`);
      }
    }

    return mcpResult;
  }
}
