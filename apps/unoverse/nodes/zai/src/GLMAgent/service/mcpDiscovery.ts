/**
 * MCP Tool Discovery (chat-completions shape)
 *
 * Identical mechanism to the OpenAI package's discoverMCPTools, but emits tools in the
 * Chat Completions `{ type: "function", function: {...} }` shape that GLM expects (the
 * OpenAI Responses API uses a flat shape; GLM/Z.AI speaks chat-completions).
 *
 * MCP providers are wired through the node's `serviceConnectors` (serviceType "mcp",
 * isService false). The platform exposes them via `api.callService(...)` against this
 * node's executionContext — no direct import from the provider node is needed.
 */

export interface MCPToolConfig {
  /** Chat-completions tool definitions passed to the model. */
  tools: any[];
  /** name -> callable proxy that invokes the connected MCP service. */
  mcpService: Record<string, (input: any) => Promise<any>>;
  /** Optional agent-skill instructions to append to the system prompt. */
  instructions?: string;
}

export async function discoverMCPTools(
  executionContext: any,
  logger: any,
  api?: any,
): Promise<MCPToolConfig | null> {
  if (!executionContext) {
    logger.warn("[GLMAgent] No executionContext - cannot discover MCP tools");
    return null;
  }

  if (!api?.callService) {
    logger.warn("[GLMAgent] callService not available - running without tools");
    return null;
  }

  try {
    const mcpSchema = await api.callService("getSchema", {}, executionContext);

    if (!mcpSchema?.methods) {
      logger.info("[GLMAgent] No MCP methods in schema - running without tools");
      return null;
    }

    const methodNames = Object.keys(mcpSchema.methods);
    logger.info(`[GLMAgent] Discovered ${methodNames.length} MCP tool(s): ${methodNames.join(", ")}`);

    // Chat Completions tool shape (nested under `function`)
    const tools = Object.entries(mcpSchema.methods).map(([methodName, methodSchema]: [string, any]) => ({
      type: "function",
      function: {
        name: methodName,
        description: methodSchema.description || `Execute ${methodName} operation`,
        parameters: methodSchema.input || { type: "object", properties: {} },
      },
    }));

    const mcpService: Record<string, (input: any) => Promise<any>> = {};
    for (const methodName of methodNames) {
      mcpService[methodName] = async (input: any) => {
        logger.info(`[GLMAgent] Calling MCP tool: ${methodName}`, { input });
        return api.callService(methodName, input, executionContext);
      };
    }

    return { tools, mcpService, instructions: mcpSchema.instructions || undefined };
  } catch (error) {
    logger.debug?.("[GLMAgent] No MCP service connected", { error: (error as Error).message });
    return null;
  }
}
