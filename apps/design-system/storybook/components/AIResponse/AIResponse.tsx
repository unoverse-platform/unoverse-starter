import React, { useState, useEffect, useRef } from "react";
import Markdown from "markdown-to-jsx";
import styles from "./AIResponse.module.css";
import { normalizeMarkdownTables } from "./tableNormalizer";

// Custom link component that opens in new tab
const ExternalLink = ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a {...props} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

// Wrap tables in a horizontally-scrollable container so wide tables never get
// crushed (which forces character-by-character wrapping) inside the capped
// .textContent width. The wrapper scrolls instead of squeezing.
const ScrollableTable = ({ children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
  <div className={styles.tableWrapper}>
    <table {...props}>{children}</table>
  </div>
);

// Render markdown images responsively. AI-generated documents frequently cite
// external image URLs that 404 — on error we degrade to the alt text instead of
// a broken-image icon. lazy/async keeps long documents cheap to render.
const MarkdownImage = ({ src, alt, title }: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return <span className={styles.imageFallback}>{alt || "Image unavailable"}</span>;
  }
  return (
    <img
      className={styles.markdownImage}
      src={src}
      alt={alt || ""}
      title={title}
      loading="lazy"
      decoding="async"
      onError={() => setBroken(true)}
    />
  );
};

const markdownOptions = {
  overrides: {
    a: { component: ExternalLink },
    table: { component: ScrollableTable },
    img: { component: MarkdownImage },
  },
};

interface AIResponseProps {
  progressText?: string;
  text?: string;
  questions?: string[]; // Always an array of strings
  onQuestionClick?: (question: string) => void;
  className?: string;
  nodeId?: string; // For Zustand store subscription
  isStreaming?: boolean; // Show typing cursor when streaming (legacy)
  streamingState?: "idle" | "streaming" | "complete"; // From renderComponent
}

// Timeout in ms to stop thinking animation after no updates
const THINKING_TIMEOUT_MS = 3000;

export default function AIResponse(props: AIResponseProps) {
  const { progressText, text, questions, onQuestionClick, className, isStreaming, streamingState } = props;

  // Derive streaming state: support both isStreaming (boolean) and streamingState (enum)
  const isCurrentlyStreaming = isStreaming ?? streamingState === "streaming";

  // Track if thinking animation should show (stops after timeout of no updates)
  const [showThinkingDots, setShowThinkingDots] = useState(true);
  const lastProgressTextRef = useRef(progressText);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset thinking dots when progressText changes, set timeout to hide them
  useEffect(() => {
    if (progressText !== lastProgressTextRef.current) {
      // New progressText received - show dots and reset timeout
      lastProgressTextRef.current = progressText;
      setShowThinkingDots(true);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout to hide dots after inactivity
      timeoutRef.current = setTimeout(() => {
        setShowThinkingDots(false);
      }, THINKING_TIMEOUT_MS);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [progressText]);

  // Hide thinking dots immediately when text starts streaming
  useEffect(() => {
    if (text && text.length > 0) {
      setShowThinkingDots(false);
    }
  }, [text]);

  const questionList = questions || [];

  return (
    <div className={`${styles.container} ${className || ""}`}>
      {/* Reasoning/Thinking - show when progressText exists, dots animate until timeout */}
      {progressText && (
        <div className={styles.progress}>
          {showThinkingDots && (
            <span className={styles.dotsContainer}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </span>
          )}
          <Markdown options={markdownOptions}>{normalizeMarkdownTables(progressText)}</Markdown>
        </div>
      )}

      {/* Text - show directly, aiContext protects against shorter text overwrites */}
      {text && (
        <div className={`${styles.textContent} prose`}>
          <Markdown options={markdownOptions}>{normalizeMarkdownTables(text)}</Markdown>
          {/* Animated blinking cursor inline with text */}
          {isCurrentlyStreaming && <span className={styles.cursor} />}
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
