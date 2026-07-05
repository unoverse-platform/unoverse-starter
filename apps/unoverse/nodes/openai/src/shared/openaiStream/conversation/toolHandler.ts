/**
 * Tool Call Handler
 * Processes tool calls and determines conversation flow
 */

import { executeToolCallsInParallel, MCPTraceContext, ToolCall } from "../mcp/toolExecution";
import { StreamState } from "../streaming/streamProcessor";
import { ResponseInputItem, MCPResult } from "./types";

export interface ToolHandlerResult {
  shouldEndConversation: boolean;
  mcpResults: MCPResult[];
  toolOutputs: ResponseInputItem[];
  discoveredMCPs?: DiscoveredMCP[];
}

export interface DiscoveredMCP {
  id: string;
  title: string;
  description: string;
  workflowId: string;
  nodeId: string;
  methodName: string;
  schema?: any; // Full MCP schema from metadata.schema
}

/**
 * Check if any tool is a workflow MCP (ends conversation).
 *
 * Provenance, not a hardcoded name list: a tool keeps the conversation going if it
 * was wired in up front (in `coreToolNames`, the getSchema set — SpatialSearch,
 * memory, and connector MCPs like Salesforce / SmartDocument). The ONLY tools that
 * end the turn are the workflow handoffs spatial surfaces dynamically mid-loop
 * (e.g. speakToLiveAgent, bankTransfer) — those are never in the wired set.
 *
 * If we have no wired-tool info, we can't identify a handoff, so we keep going
 * (realtime-style) rather than guess.
 */
export function hasWorkflowMCP(toolCalls: ToolCall[], coreToolNames?: Set<string>): boolean {
  if (!coreToolNames || coreToolNames.size === 0) return false;
  return toolCalls.some((tc: ToolCall) => !coreToolNames.has(tc.function.name));
}

/**
 * Parse tool result to JSON
 */
function parseToolResult(content: string): any {
  try {
    return JSON.parse(content || "{}");
  } catch {
    return content;
  }
}

/**
 * Process tool calls and return results
 */
export async function handleToolCalls(
  streamState: StreamState,
  mcpService: Record<string, (input: any) => Promise<any>>,
  logger: any,
  traceContext?: MCPTraceContext,
  api?: any,
  coreToolNames?: Set<string>,
): Promise<ToolHandlerResult> {
  logger.info(`🔧 Model requested ${streamState.toolCalls.length} tool call(s)`);

  // Execute all tool calls in parallel
  const toolResults = await executeToolCallsInParallel(streamState.toolCalls, mcpService, logger, traceContext, api);

  // Check if workflow MCP was called — refined by RESULT: a workflow tool whose result
  // carries `output` is an interactive app's SLOW CALL (the user completed it and the
  // answers are the tool result — UNOVERSE_NODE_RUNTIME § Component outputs); the
  // conversation CONTINUES with them. Only output-less workflow handoffs (fire-and-
  // forget, e.g. a live-agent transfer) end the turn. Same provenance philosophy as
  // hasWorkflowMCP: decided by wiring + what actually came back, never a name list.
  const isWorkflowMCP =
    hasWorkflowMCP(streamState.toolCalls, coreToolNames) &&
    streamState.toolCalls.some((tc: ToolCall, i: number) => {
      if (coreToolNames?.has(tc.function.name)) return false;
      const res = parseToolResult(toolResults[i]?.content);
      // Slow app calls resolve with `output` (or an explicit completed/error status) —
      // the agent continues with that result. Only the fire-and-forget handoff
      // signature ({ status: "started" } / unparseable) ends the turn.
      if (res && typeof res === "object" && (res.output || res.status === "completed" || res.status === "error")) return false;
      return true;
    });

  // Build MCP results for emission
  const mcpResults: MCPResult[] = streamState.toolCalls.map((toolCall: ToolCall, index: number) => ({
    name: toolCall.function.name,
    arguments: JSON.parse(toolCall.function.arguments),
    result: parseToolResult(toolResults[index]?.content),
  }));

  // Extract discovered MCPs from findIntent/discoverRelated results
  const discoveredMCPs: DiscoveredMCP[] = [];
  for (let i = 0; i < streamState.toolCalls.length; i++) {
    const toolName = streamState.toolCalls[i].function.name;
    if (toolName === "findIntent" || toolName === "discoverRelated") {
      const results = parseToolResult(toolResults[i]?.content);
      if (Array.isArray(results)) {
        for (const item of results) {
          if (item.object_type === "mcp" && item.metadata?.schema?.methods) {
            // Get methodName from schema.methods keys
            const methodName = Object.keys(item.metadata.schema.methods)[0];
            if (methodName) {
              discoveredMCPs.push({
                id: item.id || item.universal_id,
                title: item.title || "",
                description: item.description || "",
                workflowId: item.metadata?.workflowId || item.workflow_id,
                nodeId: item.metadata?.nodeId,
                methodName,
                schema: item.metadata?.schema,
              });
            }
          } else if (item.object_type === "mcp" && item.metadata?.workflow && item.metadata?.trigger) {
            // Unoverse app (UNOVERSE_MCP_TEMPLATE_PROTOCOL §4b): no schema.methods — the app
            // IS the tool. Mint it from name + inputSchema; calling it fires workflow@trigger
            // via the same invokeMCP path. Method name = the app name (matches the executor side).
            const methodName = item.metadata.name;
            if (methodName) {
              const input = item.metadata.inputSchema || { type: "object", properties: { message: { type: "string" } } };
              // Etiquette rides the TOOL DESCRIPTION — the only channel that reaches the
              // model for a tool minted MID-conversation (instructions are built once at
              // loop start and never re-read). Without it the model treats the app as
              // invisible machinery and BOTH answers in text AND opens the UI (observed
              // live: full interview streamed next to the wizard asking the same things).
              const appDescription =
                `${item.description || item.title || methodName} INTERACTIVE APP: calling this renders a UI the user ` +
                `completes on screen. When you call it, reply with at most ONE short sentence inviting the user to it — ` +
                `never answer the request in text alongside it, never list options, never ask questions the app will ` +
                `collect. If the result includes \`output\`, those are the user's complete answers — continue the task ` +
                `with them (search if the request needs a lookup) and only then answer.`;
              discoveredMCPs.push({
                id: item.id || item.universal_id,
                title: item.title || "",
                description: appDescription,
                workflowId: item.metadata.workflow || item.workflow_id,
                nodeId: item.metadata.trigger,
                methodName,
                schema: { methods: { [methodName]: { description: appDescription, input } } },
              });
            }
          }
        }
      }
    }
  }

  // Build tool outputs for next iteration (only if not workflow MCP)
  const toolOutputs: ResponseInputItem[] = isWorkflowMCP
    ? []
    : toolResults.map((result, i) => ({
        type: "function_call_output" as const,
        call_id: streamState.toolCalls[i].id,
        output: result.content,
      }));

  return {
    shouldEndConversation: isWorkflowMCP,
    mcpResults,
    toolOutputs,
    discoveredMCPs: discoveredMCPs.length > 0 ? discoveredMCPs : undefined,
  };
}
