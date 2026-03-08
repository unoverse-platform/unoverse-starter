/**
 * AssistantAvatar - AI avatar with optional streaming animation
 * Flexible component that can wrap content or be used standalone
 */

import React from "react";
import styles from "./AssistantAvatar.module.css";

interface AssistantAvatarProps {
  /** Avatar image URL */
  avatarUrl?: string;
  /** Content to render next to avatar (optional) */
  children?: React.ReactNode;
  /** Show animation */
  showAnimation?: boolean;
}

const DEFAULT_AVATAR_URL =
  "https://res.cloudinary.com/sonik/image/upload/v1734332867/sixflags/uxgtoiaxezsfzueh5xkn.jpg";

/**
 * AssistantAvatar - Renders AI avatar with optional content and streaming state
 */
export function AssistantAvatar({
  avatarUrl = DEFAULT_AVATAR_URL,
  children,
  showAnimation = false,
}: AssistantAvatarProps) {
  const shouldAnimate = showAnimation && !children;

  return (
    <div className={styles.container}>
      <div className={styles.avatarContainer}>
        <img src={avatarUrl} alt="AI Assistant" className={styles.avatar} />
      </div>

      {shouldAnimate && (
        <div className={styles.animationContainer}>
          <div className={styles.dotsContainer}>
            <div className={`${styles.dot} ${styles.dotAnimated} ${styles.dot1}`} />
            <div className={`${styles.dot} ${styles.dotAnimated} ${styles.dot2}`} />
            <div className={`${styles.dot} ${styles.dotAnimated} ${styles.dot3}`} />
          </div>
        </div>
      )}

      {children && <div className={styles.contentContainer}>{children}</div>}
    </div>
  );
}

export default AssistantAvatar;
