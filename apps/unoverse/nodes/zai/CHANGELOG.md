# @unoverse-platform/zai

## 1.2.2

### Patch Changes

- GLMAgent: fix MCP/tool calling under streaming. GLM only streams `tool_calls` deltas when `tool_stream: true` is sent alongside `stream: true`; without it the agent never emitted a tool call and silently treated every turn as a final answer — so findIntent/readSkill/getGoalContext/saveWorkflow all no-op'd. Now sent whenever tools are present, restoring skill loading and goal-board memory.

## 1.2.1

### Patch Changes

- GLMAgent: update node accent color.

## 1.2.0

### Minor Changes

- GLMAgent: add User Memory + Agent Memory toggles and harness goal-board injection. With Agent Memory on, a GLM agent acting as the harness builder now leads each turn with the goal-board master context (goal, locked bar, plan/progress, blockers) instead of relying on a possibly-empty Input — fixing the Z.AI 400 "prompt parameter was not received normally".

## 1.1.0

### Minor Changes

- Add Z.AI package with a GLM Agent node — a multi-turn GLM-5.2 agent with MCP tool calling, streaming text + reasoning, and Redis-backed conversation memory over Z.AI's chat-completions API.
