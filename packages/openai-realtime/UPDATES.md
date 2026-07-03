# OpenAI Realtime Package Updates

## Changes Made (2026-06-10) — Stability pass

### Tool calling
- `response.create` is now gated on BOTH all parallel tool calls completing AND the model's `response.done` arriving (previously a fast tool could request the next response early → OpenAI rejects, conversation stalls)
- Tool dispatch is counted synchronously per `function_call_arguments.done` event (previously delayed by an awaited state publish, opening a race)
- MCP tool calls have a timeout (`REALTIME_TOOL_TIMEOUT_MS`, default 30s) — a hung tool returns an error to the model instead of silencing the call forever
- `executeToolCall` is fully guarded; a failing tool always submits an error output for its `call_id` and always decrements the pending count

### Session lifecycle
- try/finally around the live session: any failure after connect closes the OpenAI WS and deregisters (previously orphaned a billed session)
- Duplicate START_CALL for the same conversation closes the previous WS client instead of orphaning it
- MCP discovery race no longer leaks an unhandled rejection; discovery timer cleared
- `WsClient` has a persistent `error` handler (second socket error previously crashed the process)

### Correctness
- Usage stats accumulate per `response.done` (previously only the final turn's tokens were saved)
- Executor rethrows on failure so the engine emits NODE_ERROR (previously failures looked like success)
- Credential selection prefers `openaiCredential`/`openAICredential` by name before the field-signature scan (the platform passes all workflow credentials; xAI creds also have `apiKey`)
- Barge-in drops buffered assistant audio instead of flushing it (still sends SPEECH_ENDED to unmute the mic)
- Module-level `getPlatformDependencies()` calls in ResponseProcessor/TextAccumulator made lazy (startup-freeze rule)

### Platform
- node-service `/execute-stream` now sends SSE keepalive comments every 30s so long silent voice calls don't trip the workflow engine's stream idle watchdog (`NODE_STREAM_IDLE_TIMEOUT_MS`)

### Voice options (doc correction)
- 10 voices: alloy, ash, ballad, coral, echo, sage, shimmer, verse, marin, cedar
- Turn detection: `semantic_vad` (default) | `server_vad` | `disabled`
- `temperature` is not a config field (previous docs mentioned it in error)

## Changes Made (2026-05-25)

### 1. Model Identifier ✅
- **Correct**: `gpt-realtime-2` (was already correct)

### 2. Turn Detection Options ✅
- Changed from `"server_vad" | "manual"` to `"server_vad" | "disabled"`
- Matches actual OpenAI Realtime API specification
- UI now shows: "Server VAD (automatic)" and "Disabled"

### 3. Node Naming ✅
- Changed from "ChatGPT Realtime Voice" to "OpenAI Realtime Voice"
- More accurate branding

### 4. Descriptions ✅
- Updated to mention `gpt-realtime-2` specifically
- Removed generic "GPT-4o" references

### 5. Voice Options ✅ (Already Correct)
All 8 voices per OpenAI API:
- alloy (default)
- ash
- ballad
- coral
- echo
- sage
- shimmer
- verse

### 6. VAD Configuration ✅ (Already Correct)
Default values in `constants.ts`:
```typescript
{
  type: "server_vad",
  threshold: 0.5,
  prefix_padding_ms: 300,
  silence_duration_ms: 500,
}
```

## Configuration Matches Screenshot

Based on https://developers.openai.com/api/docs/guides/realtime screenshot:

| Field | Value | Status |
|-------|-------|--------|
| Voice dropdown | "Alloy" | ✅ |
| Turn Detection | "Server VAD (automatic)" | ✅ |
| Temperature | 0.8 (range 0.0-1.0) | ✅ |

## Package Location

**Path**: `/packages/openai-realtime/`  
**Type**: Starter kit package (NOT marketplace)
- Ships with every deployment
- Loaded from local filesystem
- Part of root workspace

## API Details

**Model**: `gpt-realtime-2`  
**WebSocket**: `wss://api.openai.com/v1/realtime?model=gpt-realtime-2`  
**Auth**: Bearer token in WebSocket connection headers

## Next Steps

1. ✅ Package built successfully
2. Test with real OpenAI API key
3. Verify WebSocket connection
4. Test all 8 voices
5. Test server VAD vs disabled modes
6. Test MCP tool discovery
7. Verify audio streaming to Redis

## Differences from xAI Grok

| Feature | xAI Grok | OpenAI Realtime |
|---------|----------|-----------------|
| Model | grok-3 | gpt-realtime-2 |
| Voices | 5 | 8 |
| Turn Detection | server_vad / manual | server_vad / disabled |
| Credentials | ❌ Uses deprecated API | ✅ Field signature pattern |
| Event Format | Custom Grok events | OpenAI Realtime events |

## Build Status

✅ TypeScript compilation successful  
✅ All types validated  
✅ Documentation updated
