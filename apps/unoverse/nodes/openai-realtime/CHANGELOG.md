# Changelog - OpenAI Realtime Package

## [1.0.0] - 2026-05-25

### Fixed
- Changed node type from `ChatGPTRealtimeVoice` to `OpenAIRealtimeVoice`
- Changed turn detection from `"manual"` to `"disabled"` (matches OpenAI API spec)
- Updated all "ChatGPT" references to "OpenAI" or "the model" for accuracy
- Fixed provider ID in metadata to use "OpenAI Realtime Voice"

### Configuration
- **Model**: `gpt-realtime-2` ✅
- **Voices**: 8 options (alloy, ash, ballad, coral, echo, sage, shimmer, verse) ✅
- **Turn Detection**: `server_vad` (automatic) or `disabled` ✅
- **Temperature**: 0.0 - 1.0 (default 0.8) ✅
- **Max Response Tokens**: Configurable (default 4096) ✅

### Node Details
- **Type**: `OpenAIRealtimeVoice` (was `ChatGPTRealtimeVoice`)
- **Name**: "OpenAI Realtime Voice"
- **Category**: AI
- **Node ID Pattern**: `openairealtimevoice1` (lowercase, no hyphens)

### Technical Changes
1. `node/index.ts`: Updated type, descriptions
2. `node/executor.ts`: Updated constructor super() call, provider ID
3. `service/core/orchestration/SessionOrchestrator.ts`: Updated nodeType in token usage
4. `util/types.ts`: Changed `"manual"` to `"disabled"`

### Breaking Changes
⚠️ Node type changed from `ChatGPTRealtimeVoice` to `OpenAIRealtimeVoice`
- Existing workflows referencing the old type will need to be updated
- Node IDs will change (e.g., `chatgptrealtimevoice1` → `openairealtimevoice1`)
