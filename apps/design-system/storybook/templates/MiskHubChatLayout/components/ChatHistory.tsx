/**
 * ChatHistory - Renders the conversation timeline for MiskHubChatLayout
 * Self-contained component that imports shared utilities from core
 */

import React from "react";
import type { HistoryEntry, GravityClient } from "../../core/types";
import { ChatHistoryItem } from "./ChatHistoryItem";
import styles from "./ChatHistory.module.css";

interface ChatHistoryProps {
  history: HistoryEntry[];
  onQuestionClick?: (question: string) => void;
  onComponentAction?: (actionType: string, actionData: any) => void;
  client?: GravityClient;
}

export function ChatHistory({ history, onQuestionClick, onComponentAction, client }: ChatHistoryProps) {
  // Empty state - shouldn't happen since MiskHubChatLayout shows WelcomeScreen instead
  if (history.length === 0) {
    return null;
  }

  return (
    <div className={styles.historyContainer}>
      {history.map((entry) => {
        // User message - chat bubble on right
        if (entry.type === "user_message") {
          return (
            <div key={entry.id} className={styles.userMessageContainer}>
              <div className={styles.userMessageBubble}>
                <div className={styles.userMessageText}>{entry.content}</div>
              </div>
            </div>
          );
        }

        // Assistant response - uses shared ChatHistoryItem from core
        if (entry.type === "assistant_response") {
          return (
            <ChatHistoryItem
              key={entry.id}
              response={entry}
              onQuestionClick={onQuestionClick}
              onComponentAction={onComponentAction}
              client={client}
            />
          );
        }

        return null;
      })}
    </div>
  );
}

export default ChatHistory;
