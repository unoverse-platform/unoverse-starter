/**
 * ChatHistoryItem - Renders an assistant response with multiple components
 * Each response has its own streaming state that is passed to all child components
 */

import React from "react";
import type { AssistantResponse, ResponseComponent } from "../../core/types";
import type { GravityClient } from "../../core/types";
import { AssistantAvatar } from "./AssistantAvatar";
import { renderComponent } from "../../core";
import styles from "./ChatHistoryItem.module.css";

interface ChatHistoryItemProps {
  response: AssistantResponse;
  onQuestionClick?: (question: string) => void;
  onComponentAction?: (actionType: string, actionData: any) => void;
  client?: GravityClient;
}

function formatRelativeTime(date: string): string {
  const now = new Date();
  const messageDate = new Date(date);
  const diffMs = now.getTime() - messageDate.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
  if (messageDate.toDateString() === now.toDateString()) {
    return messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return messageDate.toLocaleDateString();
}

export function ChatHistoryItem({ response, onQuestionClick, onComponentAction, client }: ChatHistoryItemProps) {
  const { streamingState, components, timestamp } = response;
  const showAnimation = false; // Dots now in loading state text

  if (streamingState === "complete" && components.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <AssistantAvatar showAnimation={showAnimation} />

      <div className={styles.componentsContainer}>
        {components.length > 0 ? (
          <>
            {components.map((component: ResponseComponent) => {
              const { Component, id } = component;

              if (!Component) {
                console.warn("[ChatHistoryItem] Component not loaded for:", id, component.componentType);
                return null;
              }

              return (
                <div key={id}>
                  {renderComponent(
                    component,
                    {
                      streamingState,
                      onQuestionClick,
                      onClick: (data: any) => onComponentAction?.("click", data),
                    },
                    client?.openFocus
                  )}
                </div>
              );
            })}

            {timestamp && <span className={styles.timestamp}>{formatRelativeTime(timestamp)}</span>}
          </>
        ) : (
          streamingState === "streaming" && (
            <div className={styles.loadingState}>
              <span className={styles.dotsContainer}>
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </span>
              <span className={styles.loadingText}>Thinking...</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default ChatHistoryItem;
