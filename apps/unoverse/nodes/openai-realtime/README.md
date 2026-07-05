# @unoverse-platform/openai-realtime

OpenAI Realtime API integration for Gravity Platform — real-time voice conversations with gpt-realtime-2.

## Features

- ✅ Real-time voice input/output via WebSocket
- ✅ Server-side Voice Activity Detection (VAD)
- ✅ Function calling / tool use support
- ✅ MCP service connector auto-discovery
- ✅ Token usage tracking
- ✅ Conversation history support

## Installation

```bash
npm install @unoverse-platform/openai-realtime
```

## Node: OpenAI Realtime Voice

**Type**: CallbackNode  
**Category**: AI  
**Model**: `gpt-realtime-2`

Real-time voice conversation with OpenAI's gpt-realtime-2 model via WebSocket streaming.

### Inputs
- `input` (ANY): Input data

### Outputs
- `text` (OBJECT): `{ query, response }` — user transcription + assistant text
- `conversation` (OBJECT): `{ user, assistant }` — combined conversation
- `mcpResult` (OBJECT): MCP tool execution results
- `progress` (STRING): Real-time log of tool calls and turns

### Configuration

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| systemPrompt | string | No | "" | System instructions (supports templates) |
| conversationHistory | object | No | - | JSON array of prior messages |
| initialRequest | string | No | "" | Text sent at call start |
| voice | enum | Yes | "alloy" | Voice: alloy, ash, ballad, coral, echo, sage, shimmer, verse, marin, cedar |
| turnDetection | enum | Yes | "semantic_vad" | semantic_vad, server_vad, or disabled |
| maxResponseOutputTokens | number | No | 4096 | Max tokens per response |
| redisChannel | enum | Yes | AI_RESULT_CHANNEL | Redis channel for audio |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| REALTIME_TOOL_TIMEOUT_MS | 30000 | Max time for an MCP tool call before it returns an error to the model |

### Credentials

Requires **OpenAI API Key** (`openaiCredential`) from platform.openai.com.

## Architecture

```
src/
├── credentials/          # OpenAI credential definition
├── Realtime/
│   ├── constants.ts     # Model ID, WS URL, defaults
│   ├── node/            # Node definition + executor
│   └── service/
│       ├── index.ts     # RealtimeVoiceService entry point
│       └── core/
│           ├── orchestration/  # SessionOrchestrator
│           ├── streaming/      # WsClient, SessionManager, Registry
│           └── processing/     # ResponseProcessor
└── util/types.ts        # Shared TypeScript types
```

## Differences from xAI Grok

1. **Credentials**: Uses field signature pattern (no deprecated `getNodeCredentials`)
2. **Event Format**: OpenAI Realtime API event structure differs from Grok
3. **Function Calling**: Uses `conversation.item.create` with `function_call_output` type
4. **Turn Detection**: OpenAI uses explicit `turn_detection` config object
5. **Audio**: OpenAI supports both text and audio modalities in same session

## Usage Example

```typescript
// In a workflow:
// 1. User speaks → mic audio sent to Realtime API
// 2. Server VAD detects speech end
// 3. gpt-realtime-2 processes audio → generates text response
// 4. Text response streamed back as audio
// 5. MCP tools called if needed (e.g., search knowledge base)
```

## Control Signals

- `START_CALL`: Initiate new Realtime session
- `END_CALL`: Close WebSocket and end session

Pass via `input.metadata.action` or use separate workflow step.

## License

MIT
