/**
 * useVoiceCall - Orchestrates voice call flow
 *
 * This hook manages the complete voice call lifecycle:
 * - START_CALL via REST (`POST /api/workflows/:id/execute`) — not GraphQL.
 * - Continuous mic streaming over the unified WebSocket `/ws/gravity` (binary).
 * - Audio playback for the assistant response (provider-side VAD).
 * - END_CALL via WebSocket control message (`AUDIO_CONTROL { command: "stop" }`).
 *
 * State is managed centrally in Zustand store (useAIContext).
 * This hook reads from the store and provides actions.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { GravityClient } from "../../core/types";

/** Connection status for voice calls */
export type ConnectionStatus = "idle" | "connecting" | "connected" | "ended" | "error";

export interface UseVoiceCallOptions {
  /** Full client context from gravity-client */
  client: GravityClient;
}

export interface UseVoiceCallReturn {
  /** Current connection status */
  connectionStatus: ConnectionStatus;
  /** Whether call is active */
  isCallActive: boolean;
  /** Whether assistant is speaking */
  isAssistantSpeaking: boolean;
  /** Whether user is speaking (mic capturing) */
  isUserSpeaking: boolean;
  /** Whether microphone is muted */
  isMuted: boolean;
  /** Whether the agent is currently calling a tool / searching the knowledge base */
  isLookingUp: boolean;
  /** Name of the tool currently being called (when isLookingUp is true) */
  lookupToolName: string | null;
  /** Call duration in seconds */
  callDuration: number;
  /** Start the call */
  startCall: () => Promise<void>;
  /** End the call */
  endCall: () => Promise<void>;
  /** Toggle mute */
  toggleMute: () => void;
  /** Error message if any */
  error: string | null;
}

export function useVoiceCall(options: UseVoiceCallOptions): UseVoiceCallReturn {
  const { client } = options;
  const { session, sendVoiceCallMessage, audio } = client;
  const { conversationId, userId, workflowId, targetTriggerNode } = session;

  // Local UI state (template-specific only)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupToolName, setLookupToolName] = useState<string | null>(null);

  // isAssistantSpeaking and isUserSpeaking come from shared lib (client.audio)
  // The shared lib handles muting, VAD pause/resume, and state management
  // Template just reads the shared state

  // Refs
  const chatIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Generate chat ID for session
  const generateChatId = useCallback(() => {
    return `voice_${conversationId}_${Date.now()}`;
  }, [conversationId]);

  // Start call
  const startCall = useCallback(async () => {
    if (!audio || !sendVoiceCallMessage) {
      setError("Audio utilities not available");
      return;
    }

    setConnectionStatus("connecting");
    setError(null);
    setCallDuration(0);

    // Generate chat ID
    const chatId = generateChatId();
    chatIdRef.current = chatId;

    try {
      // 1. Send START_CALL via REST (don't await — the workflow stays open
      // for the duration of the call; resolution would block the UI).
      console.log("[useVoiceCall] Sending START_CALL", { workflowId, targetTriggerNode });
      sendVoiceCallMessage({
        message: "Start call",
        userId,
        chatId,
        conversationId,
        workflowId,
        targetTriggerNode,
        action: "START_CALL",
      }).catch((err) => console.error("[useVoiceCall] START_CALL error:", err));

      // 2. Start microphone capture immediately
      // The onAudioState subscription will handle SESSION_READY for UI updates
      console.log("[useVoiceCall] About to call startCapture...");
      const result = await audio.capture.startCapture();
      console.log("[useVoiceCall] Microphone started, result:", result);

      // 3. Start timer
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      setConnectionStatus("connected");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to start call";
      console.error("[useVoiceCall] Error starting call:", err);
      setError(errorMessage);
      setConnectionStatus("error");
    }
  }, [audio, conversationId, userId, workflowId, targetTriggerNode, sendVoiceCallMessage, generateChatId]);

  // End call
  const endCall = useCallback(async () => {
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (audio) {
      // Stop microphone
      await audio.capture.stopCapture();

      // Stop playback
      audio.playback.stopAll();

      // Send AUDIO_CONTROL stop command via WebSocket
      // This tells the server to end the Nova session gracefully
      // DO NOT use sendVoiceCallMessage - that starts a NEW workflow!
      console.log("[useVoiceCall] Sending AUDIO_CONTROL stop via WebSocket to end Nova session");
      audio.websocket.sendControl("AUDIO_CONTROL", {
        command: "stop",
        workflowId,
      });

      // Close WebSocket after sending stop
      audio.websocket.disconnect();
    }

    // Reset local state (isAssistantSpeaking is managed by shared lib)
    setConnectionStatus("ended");
    setIsMuted(false);
    chatIdRef.current = null;
  }, [audio, workflowId]);

  // Toggle mute. Drives the manual mute control on the mic capture pipeline.
  // (Auto-mute during assistant playback was removed to support barge-in.)
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      audio?.capture.setMuted?.(next);
      return next;
    });
  }, [audio]);

  // Subscribe to audio state changes for connection status only
  // isAssistantSpeaking is managed by shared lib (client.audio.isAssistantSpeaking)
  useEffect(() => {
    if (!audio?.onAudioState) return;

    const unsubscribe = audio.onAudioState((event) => {
      console.log("[useVoiceCall] Audio state changed:", event.state);
      if (event.state === "SESSION_ENDED") {
        setConnectionStatus("ended");
      }
      if (event.state === "USER_SPEECH_STARTED") {
        // Barge-in: cut assistant playback the moment VAD detects user speech
        audio.playback.stopAll();
      }
      if (event.state === "TOOL_USE") {
        setIsLookingUp(true);
        const name = (event.metadata?.toolName as string | undefined) ?? null;
        setLookupToolName(name);
      }
      if (event.state === "TOOL_USE_COMPLETED") {
        setIsLookingUp(false);
        setLookupToolName(null);
      }
    });

    return unsubscribe;
  }, [audio]);

  // isUserSpeaking is derived from capture state (no local state needed)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      audio?.websocket.disconnect();
    };
  }, [audio]);

  // Read speaking states from shared lib (single source of truth)
  // The shared lib handles muting, VAD pause/resume, and mutual exclusion
  const isAssistantSpeaking = audio?.isAssistantSpeaking ?? false;
  const isUserSpeaking = audio?.capture.isSpeaking ?? false;

  return {
    connectionStatus,
    isCallActive: connectionStatus === "connected" || connectionStatus === "connecting",
    isAssistantSpeaking,
    isUserSpeaking,
    isMuted,
    isLookingUp,
    lookupToolName,
    callDuration,
    startCall,
    endCall,
    toggleMute,
    error: error || audio?.capture.error || null,
  };
}
