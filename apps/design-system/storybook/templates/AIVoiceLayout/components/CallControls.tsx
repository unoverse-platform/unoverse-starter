/**
 * CallControls - Control buttons for voice calls
 *
 * Provides:
 * - Start call button (idle state)
 * - End call button (active state)
 * - Mute/unmute toggle (active state)
 */

import React from "react";
import styles from "./CallControls.module.css";

export interface CallControlsProps {
  /** Whether call is active */
  isCallActive: boolean;
  /** Whether microphone is muted */
  isMuted?: boolean;
  /** Whether currently connecting */
  isConnecting?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Start call handler */
  onStartCall?: () => void;
  /** End call handler */
  onEndCall?: () => void;
  /** Toggle mute handler */
  onToggleMute?: () => void;
}

export function CallControls({
  isCallActive,
  isMuted = false,
  isConnecting = false,
  disabled = false,
  onStartCall,
  onEndCall,
  onToggleMute,
}: CallControlsProps) {
  if (!isCallActive) {
    // Idle state - show start button
    return (
      <div className={styles.container}>
        <button
          className={`${styles.button} ${styles.startButton}`}
          onClick={onStartCall}
          disabled={disabled}
          aria-label="Start call"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.icon}>
            <path
              fillRule="evenodd"
              d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
              clipRule="evenodd"
            />
          </svg>
          <span>Start Call</span>
        </button>
      </div>
    );
  }

  // Active state - show end and mute buttons
  return (
    <div className={styles.container}>
      {/* Mute button */}
      <button
        className={`${styles.button} ${styles.muteButton} ${isMuted ? styles.muted : ""}`}
        onClick={onToggleMute}
        disabled={isConnecting}
        aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
      >
        {isMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.icon}>
            <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM17.78 9.22a.75.75 0 10-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 001.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 101.06-1.06L20.56 12l1.72-1.72a.75.75 0 00-1.06-1.06l-1.72 1.72-1.72-1.72z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.icon}>
            <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
            <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
          </svg>
        )}
      </button>

      {/* End call button */}
      <button className={`${styles.button} ${styles.endButton}`} onClick={onEndCall} aria-label="End call">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={styles.icon}>
          <path
            fillRule="evenodd"
            d="M1.5 4.5a3 3 0 013-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 01-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 006.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 011.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 01-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5z"
            clipRule="evenodd"
          />
          <path d="M19.5 4.5l-15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
