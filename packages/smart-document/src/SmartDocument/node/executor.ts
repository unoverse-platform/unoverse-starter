import {
  getPlatformDependencies,
  type NodeExecutionContext,
} from "@gravity-platform/plugin-base";
import type {
  SmartDocumentConfig,
  SmartDocumentOutput,
} from "../util/types";
import { initDoc, keyFor } from "../service/markdownStore";
import {
  handleView,
  handleCreate,
  handleStrReplace,
  handleInsert,
} from "../service/mcpHandlers";
import { SmartDocumentMCPSchema } from "../service/mcpSchema";

const { PromiseNode } = getPlatformDependencies();

const NODE_TYPE = "SmartDocument";

function resolveKey(context: NodeExecutionContext): string | null {
  const conversationId =
    (context as any).publishingContext?.conversationId ??
    (context as any).conversationId ??
    null;
  if (!conversationId) return null;
  return keyFor(conversationId, context.nodeId);
}

export default class SmartDocumentExecutor extends PromiseNode<SmartDocumentConfig> {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    _inputs: Record<string, any>,
    config: SmartDocumentConfig,
    context: NodeExecutionContext
  ): Promise<SmartDocumentOutput> {
    const api = (context as any).api;
    const key = resolveKey(context);

    if (!key) {
      throw new Error(
        "SmartDocument requires a conversationId on the execution context to derive its state key"
      );
    }

    const seeded = await initDoc(api, key, config.initialMarkdown ?? "");

    this.logger.info(
      `📝 [SmartDocument] Initialised ${key} (version=${seeded.version}, length=${seeded.content.length})`
    );

    return {
      __outputs: {
        markdown: seeded.content,
      },
    };
  }

  /**
   * Handle MCP service calls from the connected agent.
   *
   * `getSchema` returns SmartDocumentMCPSchema directly — package MCP nodes must handle
   * getSchema here because workflow-service routes the call to node-service via HTTP.
   * (The "don't expose getSchema" rule in MCP_COMPLETE_GUIDE.md is specific to
   * SpatialSearch's dynamic schema discovery, not generic MCP providers.)
   */
  async handleServiceCall(
    method: string,
    params: any,
    config: SmartDocumentConfig,
    context: NodeExecutionContext
  ): Promise<any> {
    const api = (context as any).api;

    if (method === "getSchema") {
      return SmartDocumentMCPSchema;
    }

    const key = resolveKey(context);

    if (!key) {
      return { ok: false, error: "not_initialised", message: "no conversationId" };
    }

    // Ensure state exists even if the tool is called before executeNode ran.
    await initDoc(api, key, config?.initialMarkdown ?? "");

    switch (method) {
      case "view":
        return handleView(api, key, params || {});
      case "create":
        return handleCreate(api, key, params || {});
      case "str_replace":
        return handleStrReplace(api, key, params || {});
      case "insert":
        return handleInsert(api, key, params || {});
      default:
        throw new Error(`Unknown SmartDocument method: ${method}`);
    }
  }
}

// Re-export the schema so platform MCP registration can find it.
export { SmartDocumentMCPSchema };
