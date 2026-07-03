/**
 * CallAvatar - Animated avatar for voice calls
 *
 * Shows visual feedback for call state:
 * - Idle: Static avatar
 * - Connecting: Pulsing animation
 * - Speaking: Audio wave animation + video playback
 */

import React, { useEffect, useRef } from "react";
import styles from "./CallAvatar.module.css";

export interface CallAvatarProps {
  /** Avatar image URL */
  avatarUrl?: string;
  /** Speaking video URL - plays when assistant is speaking */
  speakingVideoUrl?: string;
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
  speakingVideoUrl,
  name = "Assistant",
  isSpeaking = false,
  isConnecting = false,
  isActive = false,
  size = "large",
}: CallAvatarProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Control video playback based on speaking state
  // Play from 0, ping-pong loop between LOOP_START and LOOP_END while speaking,
  // play to end and pause on final frame when done
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !speakingVideoUrl) return;

    const LOOP_START = 3.0;
    const LOOP_END = 5.0;
    const REVERSE_STEP = 1 / 30; // ~30fps step for reverse playback

    if (isSpeaking) {
      video.currentTime = 0;
      video.play().catch(err => {
        console.warn("Video play failed:", err);
      });

      let direction: "forward" | "reverse" = "forward";
      let animFrameId: number | null = null;
      let lastTime = 0;

      const handleTimeUpdate = () => {
        if (direction === "forward" && video.currentTime >= LOOP_END) {
          // Switch to reverse: pause native playback, animate backward
          video.pause();
          direction = "reverse";
          lastTime = performance.now();
          animFrameId = requestAnimationFrame(stepBackward);
        }
      };

      const stepBackward = (now: number) => {
        const delta = (now - lastTime) / 1000; // seconds elapsed
        lastTime = now;
        video.currentTime = Math.max(LOOP_START, video.currentTime - delta);

        if (video.currentTime <= LOOP_START) {
          // Switch back to forward: resume native playback
          direction = "forward";
          video.currentTime = LOOP_START;
          video.play().catch(err => {
            console.warn("Video play failed:", err);
          });
        } else {
          animFrameId = requestAnimationFrame(stepBackward);
        }
      };

      video.addEventListener("timeupdate", handleTimeUpdate);
      return () => {
        video.removeEventListener("timeupdate", handleTimeUpdate);
        if (animFrameId !== null) cancelAnimationFrame(animFrameId);
      };
    } else {
      // Stop speaking: continue playing to end, then pause on final frame
      video.play().catch(err => {
        console.warn("Video play failed:", err);
      });

      const handleEnded = () => {
        video.pause();
      };

      video.addEventListener("ended", handleEnded);
      return () => {
        video.removeEventListener("ended", handleEnded);
      };
    }
  }, [isSpeaking, speakingVideoUrl]);

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
        {speakingVideoUrl ? (
          <video
            ref={videoRef}
            src={speakingVideoUrl}
            className={styles.avatarImage}
            muted
            playsInline
          />
        ) : avatarUrl ? (
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
