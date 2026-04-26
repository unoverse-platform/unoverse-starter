import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { StreamingState, useFocusedComponent } from "../core";
import type { AssistantResponse } from "../core";
import ChatInput from "../../components/ChatInput";
import { ChatHistory } from "./components/ChatHistory";
import { LiveAgentBanner } from "./components/LiveAgentBanner";
import { WelcomeScreen } from "../SABChatLayout/components/WelcomeScreen";
import { useAmazonConnect } from "./hooks/useAmazonConnect";
import type { SABLiveChatLayoutProps } from "./types";
import styles from "./SABLiveChatLayout.module.css";

// SAB Logo URL
const SAB_LOGO_URL = "https://res.cloudinary.com/sonik/image/upload/v1764865338/SAB/sablogo.jpg";

/**
 * SABLiveChatLayout - SAB live chat interface with Amazon Connect integration
 *
 * Features:
 * - Welcome screen with suggestions (like SABChatLayout)
 * - Amazon Connect live agent integration
 * - Auto-connects to Amazon Connect on load
 * - Unified conversation history
 */
export default function SABLiveChatLayout(props: SABLiveChatLayoutProps) {
  const {
    client,
    onStateChange,
    placeholder = "Ask me anything...",
    autoScroll = true,
    logoUrl = SAB_LOGO_URL,
    brandName = "SAB Smart Assistant",
    brandSubtitle = "How can I help you today?",
    amazonConnectConfig,
    customerInfo,
    onLiveAgentModeChange,
    _storybook_connected = false,
  } = props;

  // Access history directly from client
  const history = client.history.entries;

  // Focus panel — streamed component renders on the right
  const { isFocusOpen, focusedComponent, closeFocus } = useFocusedComponent(history, client);

  // Wrap sendMessage to also trigger streaming state
  const sendToWorkflow = useCallback(
    (message: string) => {
      onStateChange?.({ isStreaming: true });
      client.sendMessage(message);
    },
    [client, onStateChange],
  );

  // Callback to send agent messages through server pipeline
  const handleAgentMessage = useCallback(
    (response: AssistantResponse) => {
      const chatId = response.chatId || `agent_${Date.now()}`;
      const agentName = response.components?.[0]?.metadata?.agentName || "Agent";

      // Send all components from the response
      client.sendAgentMessage({
        chatId,
        agentName,
        source: "amazon_connect",
        components: response.components.map((comp) => ({
          type: comp.componentType,
          props: comp.props || {},
          metadata: comp.metadata,
        })),
      });
    },
    [client],
  );

  // Callback when chat ends - emit action for client to handle (like Card2 pattern)
  const handleChatEnded = useCallback(() => {
    onLiveAgentModeChange?.(false);
    console.log("[SABLiveChatLayout] Chat ended - dispatching end_live_chat action");
    // Dispatch event like Card2 does - this works through Shadow DOM
    window.dispatchEvent(
      new CustomEvent("gravity:action", {
        detail: {
          type: "end_live_chat",
          data: { reason: "user_ended" },
          componentId: "SABLiveChatLayout",
        },
      }),
    );
  }, [onLiveAgentModeChange]);

  // Amazon Connect hook (only active if config provided)
  const amazonConnect = useAmazonConnect(amazonConnectConfig, handleAgentMessage, handleChatEnded);

  // Auto-connect to Amazon Connect when config is provided
  useEffect(() => {
    console.log("[SABLiveChatLayout] amazonConnectConfig:", amazonConnectConfig);
    if (amazonConnectConfig && amazonConnect.connectionStatus === "idle") {
      console.log("[SABLiveChatLayout] Auto-connecting to Amazon Connect...");
      // Use provided customerInfo or default anonymous user
      const info = customerInfo || { name: "Customer" };
      amazonConnect.connect(info);
    }
  }, [amazonConnectConfig, customerInfo, amazonConnect.connectionStatus]);

  // Notify parent when live agent mode changes
  useEffect(() => {
    onLiveAgentModeChange?.(amazonConnect.isConnected);
  }, [amazonConnect.isConnected, onLiveAgentModeChange]);

  // Combined send message handler - routes based on connection state
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (amazonConnect.isConnected) {
        // Route to Amazon Connect (live agent) - just send, agent messages come via handleAgentMessage
        await amazonConnect.sendMessage(message);
      } else {
        // Route to Gravity workflow (AI) - sendMessage handles history + server
        client.sendMessage(message);
      }
    },
    [amazonConnect, client],
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if any response is currently streaming
  const isStreaming = useMemo(() => {
    return history.some(
      (entry) => entry.type === "assistant_response" && entry.streamingState === StreamingState.STREAMING,
    );
  }, [history]);

  // Auto-scroll to bottom when history changes (new messages)
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, autoScroll]);

  // Auto-scroll when content updates (streaming text via Zustand)
  useEffect(() => {
    if (!autoScroll || !containerRef.current) return;

    const observer = new MutationObserver(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [autoScroll]);

  // Determine placeholder text based on mode
  const inputPlaceholder = amazonConnect.isConnected ? `Message ${amazonConnect.agentName || "agent"}...` : placeholder;

  // Disable input while connecting or streaming
  const isInputDisabled = isStreaming || amazonConnect.isConnecting;

  return (
    <div className={isFocusOpen ? styles.splitContainer : styles.container}>
      <div className={isFocusOpen ? styles.chatWindowSplit : styles.chatWindow}>
        {/* Header with logo */}
        <div className={styles.header}>
          <div className={styles.headerBrand}>
            {logoUrl && <img src={logoUrl} alt={brandName} className={styles.headerLogo} />}
          </div>
        </div>

        {/* Live Agent Banner - Shows connection status */}
        {(amazonConnect.connectionStatus !== "idle" || _storybook_connected) && (
          <LiveAgentBanner
            connectionStatus={_storybook_connected ? "connected" : amazonConnect.connectionStatus}
            agentName={amazonConnect.agentName || (_storybook_connected ? "Support Agent" : null)}
            agentAvatar={amazonConnect.agentAvatar}
            isAgentTyping={amazonConnect.isAgentTyping}
            error={amazonConnect.error}
            onDisconnect={amazonConnect.disconnect}
          />
        )}

        {/* Messages area */}
        <div ref={containerRef} className={styles.messagesArea}>
          <div className={styles.messagesContent}>
            {history.length === 0 ? (
              <WelcomeScreen
                brandName={brandName}
                brandSubtitle={brandSubtitle}
                logoUrl={logoUrl}
                onQuestionClick={handleSendMessage}
              />
            ) : (
              <div className={styles.messagesInner}>
                <ChatHistory history={history} onQuestionClick={handleSendMessage} />
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className={styles.inputArea}>
          <div className={styles.inputInner}>
            <ChatInput
              placeholder={inputPlaceholder}
              onSend={handleSendMessage}
              disabled={isInputDisabled}
              enableAudio={true}
            />
          </div>
        </div>
      </div>

      {/* ── Right: focus / streamed component panel ── */}
      {isFocusOpen && focusedComponent && (
        <div className={styles.focusPanel}>
          <button
            type="button"
            onClick={() => closeFocus?.()}
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
