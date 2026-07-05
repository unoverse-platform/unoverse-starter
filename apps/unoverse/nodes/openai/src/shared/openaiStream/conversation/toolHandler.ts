/**
 * Tool Call Handler — the OpenAI-family ADAPTER over the shared agent-MCP harness.
 *
 * All platform behavior (discovery parsing, app minting + etiquette, turn-end
 * provenance) lives in `@gravity-platform/plugin-base/agent-mcp` — shared by every
 * agent family (a conformance guard forbids forked copies). This file only maps
 * the OpenAI Responses-API wire shapes (StreamState tool calls,
 * function_call_output items) onto the harness.
 */

import { executeToolCallsInParallel, MCPTraceContext, ToolCall } from "../mcp/toolExecution";
import { StreamState } from "../streaming/streamProcessor";
import { ResponseInputItem, MCPResult } from "./types";
import {
  AgentToolExchange,
  DiscoveredMCP,
  hasDynamicHandoff,
  isTurnEndingHandoff,
  parseDiscoveredMCPs,
  parseToolResult,
} from "@gravity-platform/plugin-base/agent-mcp";

export type { DiscoveredMCP };

export interface ToolHandlerResult {
  shouldEndConversation: boolean;
  mcpResults: MCPResult[];
  toolOutputs: ResponseInputItem[];
  discoveredMCPs?: DiscoveredMCP[];
}

/** Back-compat wrapper over the harness's provenance check (OpenAI wire shape in). */
export function hasWorkflowMCP(toolCalls: ToolCall[], coreToolNames?: Set<string>): boolean {
  return hasDynamicHandoff(
    toolCalls.map((tc) => tc.function.name),
    coreToolNames,
  );
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

  // Neutral view of this batch for the shared harness: name + result content.
  const exchanges: AgentToolExchange[] = streamState.toolCalls.map((tc: ToolCall, i: number) => ({
    name: tc.function.name,
    resultContent: toolResults[i]?.content,
  }));

  // Turn-end provenance + result-shape rule — shared harness (agentMcp.shared.ts).
  const isWorkflowMCP = isTurnEndingHandoff(exchanges, coreToolNames);

  // Build MCP results for emission
  const mcpResults: MCPResult[] = streamState.toolCalls.map((toolCall: ToolCall, index: number) => ({
    name: toolCall.function.name,
    arguments: JSON.parse(toolCall.function.arguments),
    result: parseToolResult(toolResults[index]?.content),
  }));

  // Discovery parsing (node-MCP rows + Unoverse app rows incl. the INTERACTIVE-APP
  // etiquette description) — shared harness.
  const discoveredMCPs = parseDiscoveredMCPs(exchanges);

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
