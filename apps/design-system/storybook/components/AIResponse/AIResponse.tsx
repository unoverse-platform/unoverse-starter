import React from "react";
import Markdown from "markdown-to-jsx";
import { getSafeMarkdown } from "./markdownBuffer";
import styles from "./AIResponse.module.css";

// Custom link component that opens in new tab
const ExternalLink = ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a {...props} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

const markdownOptions = {
  overrides: {
    a: { component: ExternalLink },
  },
};

interface AIResponseProps {
  progressText?: string;
  text?: string;
  questions?: string[]; // Always an array of strings
  onQuestionClick?: (question: string) => void;
  className?: string;
  nodeId?: string; // For Zustand store subscription
  isStreaming?: boolean; // Show typing cursor when streaming
}

export default function AIResponse(props: AIResponseProps) {
  const { progressText, text, questions, onQuestionClick, className, isStreaming } = props;

  // SIMPLE: Just show the text prop directly. Server sends accumulated text.
  const questionList = questions || [];

  return (
    <div className={`${styles.container} ${className || ""}`}>
      {/* Reasoning/Thinking - hide once text starts arriving */}
      {progressText && !text && (
        <div className={styles.progress}>
          <span className={styles.dotsContainer}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </span>
          <Markdown options={markdownOptions}>{progressText}</Markdown>
        </div>
      )}

      {/* Text - server sends accumulated chunks, use getSafeMarkdown during streaming */}
      {text && (
        <div className={`${styles.textContent} prose`}>
          <Markdown options={markdownOptions}>{getSafeMarkdown(text, !!isStreaming)}</Markdown>
          {/* Animated blinking cursor inline with text */}
          {isStreaming && <span className={styles.cursor} />}
        </div>
      )}

      {/* Questions - only show if questions are provided */}
      {questionList.length > 0 && (
        <div className={styles.questionsContainer}>
          {questionList.map((question, i) => (
            <button key={`q-${i}`} className={styles.questionButton} onClick={() => onQuestionClick?.(question)}>
              <svg className={styles.questionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              <span className={styles.questionText}>{question}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
