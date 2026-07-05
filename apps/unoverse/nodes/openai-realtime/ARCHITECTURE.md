# OpenAI Realtime Package Architecture

## Overview

This package implements the OpenAI Realtime API (GPT-4o-realtime) for Gravity Platform, providing real-time voice conversations with function calling support.

## Key Design Decisions

### 1. Credential Retrieval Pattern ✅

**Problem**: xai-grok uses deprecated `getNodeCredentials()` which CLAUDE.md explicitly forbids.

**Solution**: This package uses the **field signature pattern**:

```typescript
private getCredentials(context: any): { apiKey: string } {
  const available = (context as any).credentials || {};
  let creds: any;
  for (const val of Object.values(available)) {
    if ((val as any)?.apiKey) { creds = val; break; }
  }
  if (!creds?.apiKey) throw new Error("OpenAI credentials not configured");
  return { apiKey: creds.apiKey };
}
```

This matches the pattern in `/docs-starter/nodes/04-credentials.md` and avoids the unreliable API call.

### 2. WebSocket Event Handling

OpenAI Realtime API uses a different event structure than xAI Grok:

| Event Type | Description | Handler |
|------------|-------------|---------|
| `session.created` | Connection established | Log session info |
| `conversation.item.created` | User/assistant message | Extract transcription |
| `response.audio.delta` | Audio chunk (base64) | Publish to Redis |
| `response.audio_transcript.delta` | Text transcription | Accumulate text |
| `response.text.delta` | Text-only response | Accumulate text |
| `response.function_call_arguments.delta` | Streaming tool args | Buffer until done |
| `response.function_call_arguments.done` | Tool call complete | Execute tool |
| `response.done` | Turn complete | Extract usage stats |
| `input_audio_buffer.speech_started` | VAD detected speech | Log start |
| `input_audio_buffer.speech_stopped` | VAD detected silence | Log end |
| `error` | API error | Log error |

### 3. Function Calling Flow

```
1. GPT-4o streams function_call_arguments.delta events
2. ResponseProcessor buffers arguments by call_id
3. function_call_arguments.done triggers execution
4. Tool result sent back via conversation.item.create
5. response.create triggers next GPT-4o turn
```

This differs from Grok which uses custom event types.

### 4. MCP Integration

Same pattern as xai-grok:
- Auto-discover MCP schema from `context.api.callService`
- Register tools in session config
- Execute via `config.mcpService[toolName](input)`
- Save traces with timing metrics

### 5. Session Configuration

OpenAI requires explicit session.update with:
- `modalities`: ["text", "audio"]
- `voice`: "alloy" | "echo" | "shimmer"
- `instructions`: System prompt
- `tools`: Array of function definitions
- `turn_detection`: VAD config or null

### 6. Turn Detection

**Server VAD** (default):
```typescript
turn_detection: {
  type: "server_vad",
  threshold: 0.5,
  prefix_padding_ms: 300,
  silence_duration_ms: 500,
}
```

**Manual**:
```typescript
turn_detection: null  // Client sends explicit response.create
```

## File Structure

```
src/
├── index.ts                    # Plugin entry point
├── credentials/index.ts        # OpenAI credential definition
├── util/types.ts              # Shared TypeScript interfaces
└── Realtime/
    ├── constants.ts           # Model ID, WS URL, defaults
    ├── node/
    │   ├── index.ts          # Node definition
    │   └── executor.ts       # CallbackNode executor
    └── service/
        ├── index.ts          # RealtimeVoiceService
        └── core/
            ├── orchestration/
            │   └── SessionOrchestrator.ts    # Main orchestrator
            ├── streaming/
            │   ├── WsClient.ts              # WebSocket client
            │   ├── SessionManager.ts        # Session tracking
            │   └── RealtimeSessionRegistry.ts
            └── processing/
                └── ResponseProcessor.ts     # Event handler
```

## Comparison with xai-grok

| Feature | xai-grok | openai-realtime |
|---------|----------|-----------------|
| Credential retrieval | ❌ Deprecated API | ✅ Field signature |
| WebSocket URL | `wss://api.x.ai/v1/grok` | `wss://api.openai.com/v1/realtime` |
| Model | `grok-3` | `gpt-4o-realtime-preview-2024-12-17` |
| Voices | 5 (eve, ara, rex, sal, leo) | 3 (alloy, echo, shimmer) |
| Event format | Custom Grok events | OpenAI Realtime events |
| Function calling | `ConversationItemBuilder` | `conversation.item.create` |
| Turn detection | `server_vad` \| `manual` | Same |
| Audio publishing | ✅ Redis | ✅ Redis (same pattern) |
| MCP discovery | ✅ Auto | ✅ Auto (same) |
| Token tracking | ✅ Platform API | ✅ Platform API (same) |

## Testing Checklist

Before deploying:

1. [ ] Test START_CALL → END_CALL flow
2. [ ] Verify audio chunks published to Redis
3. [ ] Test MCP tool discovery + execution
4. [ ] Verify token usage saved correctly
5. [ ] Test conversation history replay
6. [ ] Test initial request immediate response
7. [ ] Test Server VAD vs Manual turn detection
8. [ ] Verify credential field signature works
9. [ ] Test error handling (invalid API key, network failure)
10. [ ] Verify session cleanup on END_CALL

## Known Limitations

1. **Audio Input**: Requires separate GravityCanvas mic audio publisher (not included in this package)
2. **No Rate Limiting**: Direct WebSocket sends — add throttling if needed
3. **No Retry Logic**: WebSocket errors require new session
4. **Fixed Model**: Hardcoded to gpt-realtime-2

## Future Enhancements

1. Add Zod schema validation for config (like OpenAI package)
2. Implement audio input subscriber (mic → WS)
3. Add rate limiting for rapid tool calls
4. Support audio-only mode (no text transcription)
5. Add session resumption on disconnect
