import React from "react";
import Markdown from "markdown-to-jsx";
import styles from "./MarkdownRenderer.module.css";

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

interface MarkdownRendererProps {
  title?: string;
  markdown?: string;
  streamingState?: "idle" | "streaming" | "complete";
  className?: string;
}

export default function MarkdownRenderer(props: MarkdownRendererProps) {
  const { title, markdown, streamingState, className } = props;
  const isStreaming = streamingState === "streaming";
  const hasContent = typeof markdown === "string" && markdown.length > 0;

  return (
    <div className={`${styles.container} ${className || ""}`}>
      {(title || isStreaming) && (
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {isStreaming && (
            <span className={styles.streamingIndicator}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.streamingLabel}>Writing…</span>
            </span>
          )}
        </div>
      )}

      {hasContent ? (
        <div className={`${styles.content} prose`}>
          <Markdown options={markdownOptions}>{markdown!}</Markdown>
        </div>
      ) : (
        <div className={styles.placeholder}>Waiting for document…</div>
      )}
    </div>
  );
}
