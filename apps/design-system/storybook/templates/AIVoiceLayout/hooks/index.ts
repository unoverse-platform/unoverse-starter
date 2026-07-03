/**
 * AIVoiceLayout hooks
 *
 * Audio utilities (capture, playback, websocket) are provided by gravity-client
 * through client.audio. This template only exports the orchestration hook.
 */

export { useVoiceCall } from "./useVoiceCall";
export type { UseVoiceCallOptions, UseVoiceCallReturn } from "./useVoiceCall";
