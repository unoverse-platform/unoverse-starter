# MCP Services Integration

## Overview

MCP (Model Context Protocol) services expose workflow nodes as tools to AI models (Nova, Claude, Grok, OpenAI). Before picking a pattern, understand that **a node has two independent channels**:

- **`handleServiceCall(method, params, config, context)`** — the **MCP channel**. Invoked when an agent calls a tool. Returns data to the agent. Does NOT drive the node's `outputs[]` or fire downstream data edges.
- **`executeNode(inputs, config, context)`** — the **workflow channel**. Invoked when the graph triggers the node. Returns `{ __outputs: { ... } }`, which propagates along data edges to downstream nodes.

These two channels are separate. An MCP tool call will not fire the node's outputs unless the handler explicitly asks the workflow engine to route them (`executeNodeWithRouting`). Conversely, a workflow-triggered execution does nothing MCP-facing.

## The three patterns

Every MCP-capable node falls into one of three shapes. Pick the one that matches what you're building.

### Pattern A — Pure MCP (service channel only)

The node is an RPC endpoint for the agent. Tool calls return data; the workflow graph never sees them. `outputs[]` and `executeNode` are typically absent (or unused at runtime).

- **Use when:** the agent just needs to *read* or *look up* something (knowledge base queries, schema lookups, user memory recall).
- **Implementation:** only `handleServiceCall`. No `executeNode`, no data-edge routing.
- **Example:** `PostgresFetch` — Nova calls `getChunksByQuery`, PostgresFetch returns rows, done.

### Pattern B — Pure workflow (execution channel only)

A normal workflow node with no MCP surface. Triggered by graph edges; emits `__outputs` to downstream nodes.

- **Use when:** the node is an ordinary step in a pipeline — transform, write, fetch.
- **Implementation:** only `executeNode`. No `handleServiceCall`, no `serviceConnectors` of type `mcp`.
- **Example:** `S3Files` — upstream node passes config, node lists S3 objects, emits `{ files, count }`.

### Pattern C — Hybrid (package nodes)

The node exposes an MCP tool surface to agents **and** emits standard workflow outputs so downstream nodes re-fire on every tool call. Use this when an agent action on the node should also propagate through the graph (e.g. a document edit refreshes a renderer).

- **Use when:** the tool call itself is the workflow trigger — you want downstream nodes to react every time the agent invokes a method.
- **Implementation:** both `handleServiceCall` and `executeNode`. Every MCP method calls `executeNodeWithRouting` so `NODE_OUTPUT` fires and downstream edges activate.
- **Example:** `SmartDocument` — `view` / `create` / `str_replace` / `insert` each return their MCP response to the agent **and** emit a workflow output carrying the current markdown, which drives `MarkdownRenderer` downstream.

## `executeNodeWithRouting` — bridging the channels

Obtain it from `getPlatformDependencies()` alongside `PromiseNode`, and call it from inside `handleServiceCall` for every method that should fire workflow outputs:

```typescript
import { getPlatformDependencies } from "@unoverse-platform/plugin-base";

const { PromiseNode, executeNodeWithRouting } = getPlatformDependencies();

async handleServiceCall(method, params, config, context) {
  // ... run the MCP handler and produce the agent response ...
  const mcpResult = await handleMethod(method, params);

  // Also emit NODE_OUTPUT so downstream nodes re-fire.
  await executeNodeWithRouting(
    this.executeNode.bind(this),
    { method, params },
    config,
    context,
  );

  return mcpResult; // agent gets the MCP response, unchanged
}
```

`executeNodeWithRouting` runs `executeNode` locally (producing `{ __outputs: { ... } }`) and bridges the result into the workflow engine so the node's outputs propagate along data edges — exactly as if the graph had triggered it. The bridge works transparently for package nodes running in the unoverse node runtime.

Pattern 1 re-runs the node's own `executeNode` — use it when the MCP params map cleanly onto what `executeNode` expects. Pattern 2 wraps results you've already computed — use it when the MCP path and the workflow path do different work (as in SpatialSearch, where `handleServiceCall` uses `searchKnowledgeBase` while `executeNode` runs `MultiTypeExecutor`).

---

## Pattern reference

### Pure MCP Data Services

These services provide data to AI models without affecting workflow execution.

#### Characteristics
- Stateless data retrieval
- Direct execution and immediate response
- No workflow side effects
- No edge triggering

#### Example: PostgresFetch Data Service
```typescript
// PostgresFetch provides data services via MCP
async handleServiceCall(method: string, params: any) {
  switch(method) {
    case "getChunksByQuery":
      // Direct database query and return
      const results = await MCPGetKnowledgeService.execute(params);
      return results; // Returns data directly to Nova
      
    case "getSchema":
      return MCPSchema; // Returns schema for tool discovery
  }
}
```

#### Use Case
Nova needs to retrieve credit card information from the knowledge base:
1. Nova calls `getChunksByQuery` tool
2. PostgresFetch queries database
3. Results returned directly to Nova
4. Nova uses information in conversation

### MCP Workflow Nodes (channel-bridging via `executeNodeWithRouting`)

These are the escape-hatch variant of Pattern C: a tool call deliberately triggers the workflow channel as well. Most MCP nodes do **not** need this — reach for it only when an agent action should kick off a downstream pipeline.

#### Characteristics
- Part of the workflow graph
- Have edges to downstream nodes
- Trigger workflow routing via NODE_OUTPUT events
- Return simplified responses to MCP callers

#### Example: MCPgetNeeds Workflow Node
```typescript
class MCPgetNeedsExecutor extends PromiseNode {
  // Standard node execution
  async executeNode(inputs, config, context) {
    const result = await IdentifyNeedsService.execute(inputs);
    
    // Returns __outputs for workflow routing
    return {
      __outputs: {
        needs: result.needs,
        count: result.count,
        found: result.count > 0  // Triggers conditional edges
      }
    };
  }
  
  // MCP service interface
  async handleServiceCall(method: string, params: any, context) {
    case "identifyNeeds":
      // Use workflow execution utility to trigger routing
      const { executeNodeWithRouting } = await import("NodeExecutionUtils");
      
      // Execute node and emit NODE_OUTPUT for routing
      const result = await executeNodeWithRouting(
        this.executeNode.bind(this),
        params,
        config,
        context
      );
      
      // Return simple response to MCP caller (not full data)
      return {
        success: true,
        message: `Found ${result.__outputs?.count || 0} needs`,
        triggered: true
      };
  }
}
```

#### Use Case
Nova identifies customer needs and triggers follow-up actions:
1. Nova calls `identifyNeeds` tool
2. MCPgetNeeds executes and finds needs
3. NODE_OUTPUT event triggers routing to next node
4. Code node receives full needs data and processes it
5. Nova receives simple success message

## Integration Solution

### The Challenge
MCP workflow nodes need to trigger downstream nodes while executing within the current workflow instance.

### Key Issues Solved

#### 1. Graph Reachability
**Problem**: Nodes downstream from MCP service providers were being filtered out as "unreachable" during workflow loading.

**Root Cause**: The GraphTraversal only considered nodes reachable from traditional trigger nodes (InputTrigger, etc.), not from MCP service nodes.

**Solution**: Modified GraphTraversal to include MCP service providers as starting points:
```typescript
// Check if node provides MCP services
const providesMCPService = serviceConnectors.some(
  (connector) => connector.serviceType === "mcp" && connector.isService === true
);
if (providesMCPService) {
  // Include as starting point for reachability
  reachable.add(node.id);
}
```

#### 2. Workflow Routing
**Problem**: MCP nodes executing via service calls weren't triggering downstream nodes.

**Solution**: Use `executeNodeWithRouting` utility that:
1. Executes the node
2. Emits NODE_OUTPUT event for routing
3. Returns simplified response to caller

### Complete Flow
```
Nova calls MCP tool → handleServiceCall
                           ↓
                    executeNodeWithRouting
                           ↓
                  ┌────────┴────────┐
                  ↓                 ↓
          executeNode        (returns to Nova)
                  ↓           simple response
           __outputs
                  ↓
         NODE_OUTPUT event
                  ↓
     State machine routes
                  ↓
     Next nodes execute
```

## Service Connector Configuration

### MCP Service Provider
Nodes that provide MCP services must declare their service connector:

```typescript
serviceConnectors: [
  {
    name: "mcpService",
    type: "service",
    serviceType: "mcp",
    isService: true,  // This node provides services
    methods: ["getSchema", "identifyNeeds"]
  }
]
```

### MCP Service Consumer
Nodes that consume MCP services (like Nova):

```typescript
serviceConnectors: [
  {
    name: "mcpService",
    type: "service", 
    serviceType: "mcp",
    isService: false,  // This node consumes services
    methods: ["getSchema"]
  }
]
```

## Schema Definition

MCP services must provide a schema for tool discovery:

```typescript
export const MCPgetNeedsSchema = {
  name: "identifyNeeds",
  description: "Identify customer needs from conversation",
  methods: {
    identifyNeeds: {
      description: "Analyze text to identify customer needs",
      input: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The text to analyze"
          }
        },
        required: ["query"]
      },
      output: {
        type: "object",
        properties: {
          needs: {
            type: "array",
            description: "Identified customer needs"
          },
          count: {
            type: "number"
          },
          found: {
            type: "boolean"
          }
        }
      }
    }
  }
};
```

## Best Practices

### 1. Service Type Selection
- Use **Pure MCP Services** for data retrieval, queries, calculations
- Use **MCP Workflow Nodes** when the action should trigger downstream nodes

### 2. Return Values
- **Internal (executeNode)**: Returns `{ __outputs: {...} }` for workflow routing
- **External (handleServiceCall)**: Returns simple status/summary for MCP caller

### 3. Error Handling
```typescript
async handleServiceCall(method: string, params: any) {
  try {
    // Handle service call
  } catch (error) {
    this.logger.error(`MCP service failed: ${method}`, error);
    // Return error in MCP format
    return {
      error: error.message,
      code: "SERVICE_ERROR"
    };
  }
}
```

### 4. Schema Validation
Always validate inputs against the schema:
```typescript
if (!params.query) {
  throw new Error("Query parameter is required");
}
```

## Integration with Nova

Nova discovers and uses MCP tools through:

1. **Schema Discovery**: Nova calls `getSchema` on connected MCP services
2. **Tool Registration**: Nova converts MCP methods to tool specifications
3. **Tool Invocation**: Nova calls tools during conversation
4. **Result Processing**: Nova receives and uses the results

Example Nova tool configuration:
```typescript
const mcpTools = Object.entries(mcpSchema.methods).map(([methodName, methodSchema]) => ({
  toolSpec: {
    name: methodName,
    description: methodSchema.description,
    inputSchema: {
      json: JSON.stringify(methodSchema.input)
    }
  }
}));
```

## Key Implementation Details

### executeNodeWithRouting Utility
A universal utility for executing nodes outside normal workflow flow:
```typescript
// From workflow/utils/NodeExecutionUtils.ts
export async function executeNodeWithRouting(
  executeNode: Function,
  params: any,
  config: any,
  context: NodeExecutionContext
): Promise<any> {
  // Execute the node
  const result = await executeNode(params, config, context);
  
  // Emit NODE_OUTPUT to trigger routing
  const actor = engine.getActor(context.executionId);
  actor.send({
    type: "NODE_OUTPUT",
    nodeId: context.nodeId,
    output: result
  });
  
  return result;
}
```

This utility is not MCP-specific and can be used by any node that needs to trigger workflow routing when called outside the normal flow.

## Troubleshooting

### Next Nodes Not Triggering
**Problem**: MCP workflow node executes but next nodes don't trigger
**Solution**: Ensure the node executes through the state machine, not directly

### Empty Results
**Problem**: MCP service returns empty results
**Solution**: Check workflow_id filtering and database queries

### Schema Not Found
**Problem**: Nova can't discover MCP tools
**Solution**: Verify service connector configuration and schema export

## Related Documentation

- [Service Connectors](./07-service-connectors.md)
