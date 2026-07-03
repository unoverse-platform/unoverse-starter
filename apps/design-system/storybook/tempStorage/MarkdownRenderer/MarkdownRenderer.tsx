import React, { useState } from "react";
import Markdown from "markdown-to-jsx";
import styles from "./MarkdownRenderer.module.css";

const ExternalLink = ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a {...props} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

// Wrap tables in a horizontally-scrollable container so wide multi-column tables
// never get crushed into character-by-character wrapping inside a narrow node.
// The wrapper scrolls instead of squeezing (see .tableWrapper in the CSS).
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
    img: { component: MarkdownImage },
    table: { component: ScrollableTable },
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
