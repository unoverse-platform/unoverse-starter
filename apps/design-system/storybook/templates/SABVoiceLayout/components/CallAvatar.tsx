/**
 * CallAvatar - Animated avatar for voice calls
 *
 * Shows visual feedback for call state:
 * - Idle: Static avatar
 * - Connecting: Pulsing animation
 * - Speaking: Audio wave animation
 */

import React from "react";
import styles from "./CallAvatar.module.css";

export interface CallAvatarProps {
  /** Avatar image URL */
  avatarUrl?: string;
  /** Assistant name (used for fallback) */
  name?: string;
  /** Whether assistant is speaking */
  isSpeaking?: boolean;
  /** Whether currently connecting */
  isConnecting?: boolean;
  /** Whether the call is active (connected or connecting) — hides rings when ended */
  isActive?: boolean;
  /** Size variant */
  size?: "small" | "medium" | "large";
}

export function CallAvatar({
  avatarUrl,
  name = "Assistant",
  isSpeaking = false,
  isConnecting = false,
  isActive = false,
  size = "large",
}: CallAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`${styles.container} ${styles[size]} ${isSpeaking ? styles.speaking : ""} ${
        isConnecting ? styles.connecting : ""
      }`}
    >
      {/* Outer glow rings — only when call is active */}
      {isActive && <div className={styles.glowRing1} />}
      {isActive && <div className={styles.glowRing2} />}
      {isActive && <div className={styles.glowRing3} />}

      {/* Avatar */}
      <div className={styles.avatar}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className={styles.avatarImage} />
        ) : (
          <span className={styles.initials}>{initials}</span>
        )}
      </div>

      {/* Audio wave indicator — only when active and speaking */}
      {isActive && isSpeaking && (
        <div className={styles.audioWave}>
          <div className={styles.bar} />
          <div className={styles.bar} />
          <div className={styles.bar} />
          <div className={styles.bar} />
          <div className={styles.bar} />
        </div>
      )}
    </div>
  );
}
