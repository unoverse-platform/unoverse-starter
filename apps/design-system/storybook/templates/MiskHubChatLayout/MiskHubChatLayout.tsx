/**
 * MiskHubChatLayout - Clean chat interface with welcome screen
 * Misk Hub — a MiSK Foundation digital platform empowering Saudi youth
 * through programs, learning, and career development.
 *
 * Focus Mode is handled universally by ChatHistory component.
 * This template just needs to route messages correctly when focused.
 */

import React, { useMemo, useCallback } from "react";
import { FocusLayout, ScrollableHistory, useStreamingState } from "../core";
import ChatInput from "../../components/ChatInput";
import { ChatHistory } from "./components/ChatHistory";
import { WelcomeScreen } from "./components/WelcomeScreen";
import type { MiskHubChatLayoutProps } from "./types";
import styles from "./MiskHubChatLayout.module.css";
import { MiskHubChatLayoutDefaults } from "./defaults";

export default function MiskHubChatLayout(props: MiskHubChatLayoutProps) {
  const {
    client,
    onStateChange,
    placeholder = MiskHubChatLayoutDefaults.placeholder,
    autoScroll = MiskHubChatLayoutDefaults.autoScroll,
    brandName = MiskHubChatLayoutDefaults.brandName,
    brandSubtitle = MiskHubChatLayoutDefaults.brandSubtitle,
    logoUrl = MiskHubChatLayoutDefaults.logoUrl,
    suggestions = MiskHubChatLayoutDefaults.suggestions,
  } = props;

  // Access history directly from client
  const history = client.history.entries;

  // Wrap sendMessage to trigger streaming state
  // Focus mode routing is handled universally by GravityClient
  const sendMessage = useCallback(
    (message: string) => {
      onStateChange?.({ isStreaming: true });
      client.sendMessage(message);
    },
    [client, onStateChange]
  );

  // Determine if we should show welcome screen (no messages yet)
  const showWelcome = history.length === 0;

  // Check if any response is currently streaming
  const isStreaming = useStreamingState(history);

  // Build focusContext from client.focusState
  const focusContext = client?.focusState?.focusedComponentId
    ? {
        isOpen: true,
        componentId: client.focusState.focusedComponentId,
        agentName: client.focusState.agentName,
        targetTriggerNode: client.focusState.targetTriggerNode,
        close: client.closeFocus,
      }
    : { isOpen: false };

  const isFocusOpen = focusContext.isOpen;

  // Get suggestions from client state (populated via SUGGESTIONS_UPDATE WebSocket event)
  const { faqs, actions, recommendations } = useMemo(() => {
    const suggestions = client.suggestions || {};
    return {
      faqs: suggestions.faqs || [],
      actions: suggestions.actions || [],
      recommendations: suggestions.recommendations || [],
    };
  }, [client.suggestions]);

  return (
    <div className={styles.container}>
      <div className={styles.chatWindow}>
        {/* Header with Misk Hub logo */}
        <div className={styles.header}>
          <div className={styles.headerBrand}>
            {logoUrl && <img src={logoUrl} alt={brandName} className={styles.headerLogo} />}
            {!logoUrl && <span className={styles.headerText}>{brandName}</span>}
          </div>
        </div>

        {/* Messages area - FocusLayout handles focus mode and keeps history mounted */}
        <div className={styles.messagesArea}>
          <FocusLayout
            history={history}
            client={client}
            focusContainerClassName={styles.focusContainer}
            closeButtonClassName={styles.focusCloseButton}
          >
            {/* Normal Mode: Scrollable messages content - ALWAYS MOUNTED by FocusLayout */}
            <div className={styles.messagesContent}>
              {showWelcome ? (
                <WelcomeScreen
                  brandName={brandName}
                  brandSubtitle={brandSubtitle}
                  logoUrl={logoUrl}
                  suggestions={suggestions}
                  onQuestionClick={sendMessage}
                />
              ) : (
                <ScrollableHistory
                  history={history}
                  enabled={autoScroll}
                  skip={showWelcome}
                  isFocusOpen={!!client?.focusState?.focusedComponentId}
                  className={styles.messagesInner}
                >
                  <ChatHistory history={history} onQuestionClick={sendMessage} client={client} />
                </ScrollableHistory>
              )}
            </div>
          </FocusLayout>
        </div>

        {/* Input area */}
        {/* TEMP FIX: Hide chat input when focus mode is open
            TODO: Remove this condition when proper focus mode layout is implemented
            that renders at chatWindow level instead of inside messagesArea.
            See FOCUS_MODE.md for the proper architecture. */}
        {!isFocusOpen && (
          <div className={styles.inputArea}>
            <ChatInput
              placeholder={placeholder}
              onSend={sendMessage}
              disabled={isStreaming}
              enableAudio={true}
              faqs={isFocusOpen ? [] : faqs}
              actions={isFocusOpen ? [] : actions}
              recommendations={isFocusOpen ? [] : recommendations}
              focusContext={focusContext}
            />
          </div>
        )}
      </div>
    </div>
  );
}
