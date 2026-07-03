/**
 * AIVoiceLayout - Voice call interface template
 *
 * A premium voice call interface for AI assistants.
 * Uses the gravity-client realtime utilities for audio streaming.
 *
 * Features:
 * - Animated avatar with speaking indicators
 * - Start/end call controls
 * - Mute/unmute toggle
 * - Connection status display
 * - Call duration timer
 */

import React, { useEffect, useState, useRef } from "react";
import { useVoiceCall } from "./hooks/useVoiceCall";
import { CallAvatar, CallControls, ConnectionStatus } from "./components";
import type { ResponseComponent, AssistantResponse } from "../core/types";
import type { AIVoiceLayoutProps } from "./types";
import styles from "./AIVoiceLayout.module.css";

// Default avatar - female
const DEFAULT_AVATAR_URL =
  "https://res.cloudinary.com/sonik/image/upload/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/v1765613643/gravity/face_female.webp";
const DEFAULT_SPEAKING_VIDEO_URL =
  "https://res.cloudinary.com/sonik/video/upload/v1780213101/gravity/testAvatar.mp4";

export default function AIVoiceLayout(props: AIVoiceLayoutProps) {
  const {
    client,
    assistantName = "Aiya",
    assistantSubtitle = "AI Consultant",
    logoUrl = DEFAULT_AVATAR_URL,
    speakingVideoUrl = DEFAULT_SPEAKING_VIDEO_URL,
    brandName = "AI Voice Assistant",
    _storybook_connected = false,
    _storybook_speaking = false,
    _storybook_listening = false,
    _storybook_duration = 0,
  } = props;

  // Focus mode — display controlled locally, but driven by client.focusState changes
  // client.focusState is set by processComponentInit (via openFocus) on every COMPONENT_INIT,
  // including repeat calls for the same component, which is how re-open after close works.
  const [focusedComponent, setFocusedComponent] = useState<ResponseComponent | null>(null);
  const isFocusOpen = focusedComponent !== null;

  const history = client?.history?.entries ?? [];
  const focusedComponentId = client?.focusState?.focusedComponentId ?? null;

  // When focusState points to a component ID, find it in history and open the panel.
  // Depends on both focusedComponentId AND history because openFocus and addComponentToResponse
  // are async — history may not yet contain the component when focusedComponentId first changes.
  useEffect(() => {
    if (!focusedComponentId) return;
    for (const entry of history) {
      if (entry.type !== "assistant_response") continue;
      for (const component of (entry as AssistantResponse).components) {
        if (component.id === focusedComponentId) {
          setFocusedComponent(component);
          return;
        }
      }
    }
  }, [focusedComponentId, history]);

  const closeFocus = () => {
    setFocusedComponent(null);
    client?.closeFocus?.();
  };

  // Notify the outer drawer to expand when focus panel opens, collapse when it closes
  useEffect(() => {
    if (isFocusOpen) {
      window.dispatchEvent(
        new CustomEvent("gravity:layout", {
          detail: { type: "expand", width: "85vw" },
        }),
      );
    } else {
      window.dispatchEvent(
        new CustomEvent("gravity:layout", {
          detail: { type: "collapse" },
        }),
      );
    }
  }, [isFocusOpen]);

  // Voice call hook - uses client.audio for all audio operations
  const {
    connectionStatus,
    isCallActive,
    isAssistantSpeaking,
    isUserSpeaking,
    isMuted,
    isLookingUp,
    lookupToolName,
    callDuration,
    startCall,
    endCall,
    toggleMute,
    error,
  } = useVoiceCall({
    client: client || {
      session: {
        conversationId: "demo-session",
        userId: "demo-user",
        workflowId: "demo-workflow",
        targetTriggerNode: "demo-trigger",
        chatId: "demo-chat",
      },
      sendMessage: () => {},
      sendAgentMessage: () => {},
      emitAction: () => {},
      history: { entries: [], getResponses: () => [] },
    },
  });

  // Use storybook demo state if provided
  const displayStatus = _storybook_connected ? "connected" : connectionStatus;
  const displayActive = _storybook_connected || isCallActive;
  const displaySpeaking = _storybook_speaking || isAssistantSpeaking;
  // CRITICAL: User cannot be listening while assistant is speaking (mutual exclusion)
  const displayListening = (_storybook_listening || isUserSpeaking) && !displaySpeaking;

  // Local timer — ticks when the call is displayed as active
  const [localDuration, setLocalDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (displayActive) {
      setLocalDuration(0);
      timerRef.current = setInterval(() => {
        setLocalDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setLocalDuration(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [displayActive]);

  const displayDuration = _storybook_duration || callDuration || localDuration;

  // Handle back button click - end call first, then dispatch event to switch template
  const handleBackClick = () => {
    // End the voice call to properly terminate the Nova stream
    if (isCallActive) {
      endCall();
    }
    // Dispatch event to switch back to chat template
    window.dispatchEvent(
      new CustomEvent("gravity:action", {
        detail: {
          type: "back_to_chat",
          data: {},
          componentId: "AIVoiceLayout",
        },
      }),
    );
  };

  return (
    <div className={isFocusOpen ? styles.splitContainer : styles.container}>
      {/* Back button */}
      <button type="button" onClick={handleBackClick} className={styles.backButton} aria-label="Back to chat">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.backIcon}>
          <path
            fillRule="evenodd"
            d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* ── Left: voice panel ── */}
      <div className={isFocusOpen ? styles.voicePanel : styles.voicePanelFull}>
        {/* Background effects */}
        <div className={styles.backgroundGradient} />
        <div className={styles.backgroundOrb1} />
        <div className={styles.backgroundOrb2} />

        {/* Main content */}
        <div className={styles.content}>
          {/* Header */}
          <div className={styles.header}>
            <h1 className={styles.brandName}>{brandName}</h1>
            <ConnectionStatus
              status={displayStatus}
              duration={displayDuration}
              error={error}
            />
          </div>

          {/* Avatar section */}
          <div className={styles.avatarSection}>
            <CallAvatar
              avatarUrl={logoUrl}
              speakingVideoUrl={speakingVideoUrl}
              name={assistantName}
              isSpeaking={displaySpeaking}
              isConnecting={displayStatus === "connecting"}
              isActive={displayActive || displayStatus === "connecting"}
              size="large"
            />
            <div className={styles.assistantInfo}>
              <h2 className={styles.assistantName}>{assistantName}</h2>
              <p className={styles.assistantSubtitle}>{assistantSubtitle}</p>
            </div>
          </div>

          {/* Status indicator - shows knowledge-base lookup OR user speaking */}
          <div className={styles.userSpeakingWrapper}>
            {isLookingUp ? (
              <div className={styles.lookingUp}>
                <span className={styles.lookingUpDot} />
                <span className={styles.lookingUpDot} />
                <span className={styles.lookingUpDot} />
                <span>
                  {lookupToolName === "findIntent"
                    ? "Searching the knowledge base..."
                    : `Looking up ${lookupToolName ?? "information"}...`}
                </span>
              </div>
            ) : displayListening ? (
              <div className={styles.userSpeaking}>
                <span className={styles.userSpeakingDot} />
                <span className={styles.userSpeakingDot} />
                <span className={styles.userSpeakingDot} />
                <span>You are speaking...</span>
              </div>
            ) : null}
          </div>

          {/* Controls */}
          <div className={styles.controls}>
            <CallControls
              isCallActive={displayActive}
              isMuted={isMuted}
              isConnecting={displayStatus === "connecting"}
              onStartCall={startCall}
              onEndCall={endCall}
              onToggleMute={toggleMute}
            />
          </div>

          {/* Instructions */}
          {!displayActive && (
            <p className={styles.instructions}>
              Tap the button above to start a voice conversation with {assistantName}
            </p>
          )}
        </div>
      </div>
      {/* end voicePanel */}

      {/* ── Right: focus / streamed component panel ── */}
      {isFocusOpen && focusedComponent && (
        <div className={styles.focusPanel}>
          <button
            type="button"
            onClick={closeFocus}
            className={styles.focusCloseButton}
            aria-label="Close panel"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className={styles.focusPanelContent}>
            {focusedComponent.Component && (
              <focusedComponent.Component
                key={focusedComponent.id}
                {...focusedComponent.props}
                nodeId={focusedComponent.nodeId}
                chatId={focusedComponent.chatId}
                displayState="focused"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
