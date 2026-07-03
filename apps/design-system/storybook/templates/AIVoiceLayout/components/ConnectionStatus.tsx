/**
 * ConnectionStatus - Visual indicator for call connection state
 */

import React from "react";
import type { ConnectionStatus as ConnectionStatusType } from "../types";
import styles from "./ConnectionStatus.module.css";

export interface ConnectionStatusProps {
  /** Current connection status */
  status: ConnectionStatusType;
  /** Call duration in seconds (shown when connected) */
  duration?: number;
  /** Error message (shown when error) */
  error?: string | null;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function ConnectionStatus({ status, duration = 0, error }: ConnectionStatusProps) {
  const getStatusText = () => {
    switch (status) {
      case "idle":
        return "Ready to call";
      case "connecting":
        return "Connecting...";
      case "connected":
        return formatDuration(duration);
      case "error":
        return error || "Connection error";
      case "ended":
        return "Call ended";
      default:
        return "";
    }
  };

  return (
    <div className={`${styles.container} ${styles[status]}`}>
      <div className={styles.indicator} />
      <span className={styles.text}>{getStatusText()}</span>
    </div>
  );
}
