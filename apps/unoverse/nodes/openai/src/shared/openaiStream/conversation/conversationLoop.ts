/**
 * Conversation Loop (GPT-5 Responses API Only)
 * Orchestrates multi-turn conversation with tool calling
 *
 * LOOP SAFETY:
 * - maxIterations: Hard cap on loop iterations (default: 10)
 * - Stuck detection: Exits if same WORKFLOW MCP calls repeat 3 times (data tools excluded)
 * - Timeout: Exits if loop exceeds timeout (default: 2 minutes)
 * - No tool calls: Natural exit when LLM stops calling tools
 * - Workflow MCP: Exits when workflow MCP is called (intent complete)
 */

import OpenAI from "openai";
import { initializeStreamState, StreamState } from "../streaming/streamProcessor";
import { ConversationConfig, ConversationResult, MCPResult } from "./types";
import { processStream } from "./streamHandler";
import { handleToolCalls, hasWorkflowMCP } from "./toolHandler";
import { toolDefFromDiscoveredMCP, pinDiscoveredTool, type ToolSchemaPins } from "@gravity-platform/plugin-base/agent-mcp";

// Loop safety constants
const DEFAULT_MAX_ITERATIONS = 10;
const DEFAULT_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const MAX_REPEATED_WORKFLOW_CALLS = 3; // Exit if same WORKFLOW MCP calls repeat this many times

// Re-export types for backwards compatibility
export type { ConversationConfig, ConversationResult, ResponseInputItem } from "./types";

/**
 * Create OpenAI stream for an iteration
 */
async function createStream(openai: OpenAI, streamParams: any, logger: any): Promise<AsyncIterable<any>> {
  logger.info("🌊 Creating stream", {
    model: streamParams.model,
    toolCount: streamParams.tools?.length || 0,
    toolChoice: streamParams.tool_choice,
  });
  return (openai as any).responses.create(streamParams);
}

/**
 * Prepare stream params for iteration
 */
function prepareIteration(
  streamParams: any,
  inputItems: any[],
  iteration: number,
  previousResponseId: string | null,
): void {
  streamParams.input = inputItems;

  // Use previous_response_id for multi-turn:
  // - iteration > 1: within same execution (tool call loop)
  // - iteration === 1 with previousResponseId: cross-execution (Redis persistence)
  if (previousResponseId) {
    streamParams.previous_response_id = previousResponseId;
  }

  if (streamParams.tools?.length > 0) {
    streamParams.tool_choice = "auto"; // Let LLM decide when to use tools
  }
}

/**
 * Generate a signature for workflow MCP calls only (excludes data tools)
 * Data tools (findIntent, readSkill, etc.) can be called repeatedly - that's normal.
 * Only workflow MCPs being repeated indicates a stuck loop.
 */
function getWorkflowMCPSignature(
  toolCalls: Array<{ function: { name: string; arguments: string } }>,
  coreToolNames?: Set<string>,
): string {
  // Filter to only workflow MCPs (the dynamically surfaced handoffs) - mirrors
  // hasWorkflowMCP: a call is a workflow MCP only if it's NOT a wired-in tool.
  if (!coreToolNames || coreToolNames.size === 0) return "";
  const workflowCalls = toolCalls.filter((tc) => !coreToolNames.has(tc.function.name));

  if (workflowCalls.length === 0) return ""; // No workflow MCPs = no stuck detection

  return workflowCalls
    .map((tc) => `${tc.function.name}:${tc.function.arguments}`)
    .sort()
    .join("|");
}

export async function runConversationLoop(config: ConversationConfig): Promise<ConversationResult> {
  const {
    openai,
    streamParams,
    inputItems,
    mcpService,
    textEmitter,
    reasoningEmitter,
    emitMcpResult,
    logger,
    traceContext,
    api,
  } = config;

  const maxIterations = config.maxIterations || DEFAULT_MAX_ITERATIONS;
  const timeoutMs = config.timeoutMs || DEFAULT_TIMEOUT_MS;
  const allToolCalls: MCPResult[] = [];

  // Wired-in tools (discovered up front via getSchema). Captured ONCE here so that
  // handoff MCPs added to streamParams.tools mid-loop are correctly seen as NOT
  // wired-in → they end the turn; everything wired stays conversational.
  const coreToolNames = new Set(config.coreToolNames || []);

  // Loop safety tracking
  const startTime = Date.now();
  let lastWorkflowSignature = "";
  let repeatedWorkflowCount = 0;

  // Session pins for discovered tool schemas (anti-rug-pull): the schema the model first
  // saw for a tool is frozen for this loop; a re-discovery that mutates it is refused.
  const schemaPins: ToolSchemaPins = new Map();

  let streamState: StreamState = initializeStreamState();
  // Use previousResponseId from config if provided (for multi-turn across executions)
  let previousResponseId: string | null = config.previousResponseId || null;
  let iteration = 0;

  while (iteration < maxIterations) {
    iteration++;

    // Timeout check
    const elapsed = Date.now() - startTime;
    if (elapsed > timeoutMs) {
      logger.warn(`⏱️ Conversation loop timeout after ${elapsed}ms`);
      break;
    }

    logger.info(`Conversation iteration ${iteration}`, { elapsedMs: elapsed });

    // Prepare params for this iteration
    prepareIteration(streamParams, inputItems, iteration, previousResponseId);

    // Create and process stream
    const stream = await createStream(openai, streamParams, logger);
    streamState = await processStream(stream, streamState, { textEmitter, reasoningEmitter, logger });

    logger.info(`📊 Iteration ${iteration} complete`, {
      textLength: streamState.fullText.length,
      toolCalls: streamState.toolCalls.length,
    });

    // No tool calls = conversation complete
    if (streamState.toolCalls.length === 0) {
      logger.info(`✨ Conversation complete`);
      break;
    }

    // Handle tool calls
    if (!mcpService) {
      logger.warn(`🛠️ Tools requested but no MCP service connected`);
      streamParams.instructions += "\n\nTools unavailable. Answer directly.";
      continue;
    }

    // Add assistant text if any
    if (streamState.iterationText) {
      inputItems.push({ type: "message", role: "assistant", content: streamState.iterationText });
    }

    // Stuck detection: only for WORKFLOW MCPs (not data tools like findIntent, readSkill)
    // Data tools can be called repeatedly as LLM gathers context - that's normal.
    const currentWorkflowSignature = getWorkflowMCPSignature(streamState.toolCalls, coreToolNames);
    if (currentWorkflowSignature !== "" && currentWorkflowSignature === lastWorkflowSignature) {
      repeatedWorkflowCount++;
      if (repeatedWorkflowCount >= MAX_REPEATED_WORKFLOW_CALLS) {
        logger.warn(`🔄 Stuck loop detected - same workflow MCP calls repeated ${repeatedWorkflowCount} times`, {
          signature: currentWorkflowSignature,
        });
        break;
      }
    } else if (currentWorkflowSignature !== "") {
      // Only reset if we have workflow calls (ignore data-only iterations)
      repeatedWorkflowCount = 0;
      lastWorkflowSignature = currentWorkflowSignature;
    }

    // Execute tools
    const toolResult = await handleToolCalls(streamState, mcpService, logger, traceContext, api, coreToolNames);

    // Emit results
    toolResult.mcpResults.forEach((r) => {
      allToolCalls.push(r);
      emitMcpResult(r);
    });

    // Workflow MCP ends conversation - don't save responseId (has pending tool call)
    if (toolResult.shouldEndConversation) {
      logger.info(`🎯 Workflow MCP detected - ending conversation`);
      return {
        fullText: streamState.fullText,
        reasoning: streamState.reasoning,
        usage: streamState.usage,
        finishReason: streamState.finishReason,
        toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
        responseId: undefined, // Don't save - has pending tool call
      };
    }

    // Add discovered MCPs as tools for next iteration
    if (toolResult.discoveredMCPs && toolResult.discoveredMCPs.length > 0 && mcpService && streamParams.tools) {
      for (const mcp of toolResult.discoveredMCPs) {
        // Shared harness mints the def — NAMESPACED name (anti-shadowing) + sanitized
        // description. Never rebuild the tool def inline (that fork is what the harness exists
        // to prevent); the model sees `def.name`, the dispatch closure calls the REAL method.
        const def = toolDefFromDiscoveredMCP(mcp);
        // Anti-rug-pull: pin the schema on first sighting; the pin map is the dedup AND the
        // change detector. A re-discovery that mutates an already-shown tool is refused.
        const pin = pinDiscoveredTool(schemaPins, def);
        if (pin.status === "mutated") {
          logger.warn(`🚫 Discovered tool schema changed after first use (rug-pull guard): ${def.name} — keeping pinned schema`);
          continue;
        }
        if (pin.status === "new") {
          streamParams.tools.push({ type: "function", name: def.name, description: def.description, parameters: def.parameters });
          (mcpService as any)[def.name] = async (input: any) => api.callService(mcp.methodName, input);
          logger.info(`🔧 Added MCP tool: ${def.name} → ${mcp.methodName}`);
        }
        // "unchanged" → already added this session; nothing to do.
      }
    }

    // Continue with tool outputs
    previousResponseId = streamState.responseId;
    inputItems.push(...toolResult.toolOutputs);
    logger.info(`📤 Added ${toolResult.toolOutputs.length} tool outputs for next iteration`);
  }

  if (iteration >= maxIterations) {
    logger.warn(`⚠️ Max iterations (${maxIterations}) reached - forcing exit`);
  }

  const totalElapsed = Date.now() - startTime;
  logger.info(`🏁 Conversation loop complete`, {
    iterations: iteration,
    totalMs: totalElapsed,
    toolCallCount: allToolCalls.length,
  });

  return {
    fullText: streamState.fullText,
    reasoning: streamState.reasoning,
    usage: streamState.usage,
    finishReason: streamState.finishReason,
    toolCalls: allToolCalls.length > 0 ? allToolCalls : undefined,
    responseId: streamState.responseId || undefined, // For multi-turn: store this to resume conversation
  };
}
