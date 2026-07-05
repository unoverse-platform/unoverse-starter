export const REALTIME_MODEL_ID = "gpt-realtime-2";
export const REALTIME_WS_URL = "wss://api.openai.com/v1/realtime";

export const DEFAULT_VOICE = "alloy";
export const AVAILABLE_VOICES = ["alloy", "ash", "ballad", "coral", "echo", "sage", "shimmer", "verse", "marin", "cedar"] as const;

export const DEFAULT_TURN_DETECTION = {
  type: "semantic_vad" as const,
};
