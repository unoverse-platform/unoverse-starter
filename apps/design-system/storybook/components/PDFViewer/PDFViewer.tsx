import React from "react";
import styles from "./PDFViewer.module.css";

interface PDFViewerProps {
  url?: string;
}

export default function PDFViewer({ url }: PDFViewerProps) {
  if (!url) {
    return <div className={styles.placeholder}>No PDF URL provided</div>;
  }

  // Tabloid is 11x17" portrait - use 100% zoom for proper display
  const pdfUrl = `${url}#toolbar=0&navpanes=0&zoom=100`;

  const handleOpenInNewTab = () => {
    window.open(url, "_blank");
  };

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <button className={styles.openButton} onClick={handleOpenInNewTab} title="Open in new tab">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      </div>
      <iframe src={pdfUrl} className={styles.pdf} title="PDF Document" />
    </div>
  );
}
