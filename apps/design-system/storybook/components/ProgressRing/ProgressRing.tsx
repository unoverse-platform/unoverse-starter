import React from "react";
import styles from "./ProgressRing.module.css";

interface ProgressRingProps {
  /** Current value. */
  value?: number;
  /** Value representing a full ring. Default 100. */
  max?: number;
  /** Metric name rendered under the ring. */
  label?: string;
  /** Override the big center text. Default is the rounded percentage, e.g. "80%". */
  centerValue?: string;
  /** Small text under the center value, e.g. "of $60k goal". */
  centerLabel?: string;
  /** Progress arc color (any CSS color). Defaults to the chart-1 token. */
  color?: string;
  /** Unfilled track color. */
  trackColor?: string;
  /** Stroke thickness in viewBox units (default 12). */
  thickness?: number;
}

const SIZE = 120;
const CENTER = SIZE / 2;

export default function ProgressRing(props: ProgressRingProps) {
  const {
    value = 0,
    max = 100,
    label,
    centerValue,
    centerLabel,
    color = "var(--color-chart-1)",
    trackColor,
    thickness = 12,
  } = props;

  const safeMax = max === 0 ? 1 : max;
  const pct = Math.max(0, Math.min(1, value / safeMax));
  const radius = CENTER - thickness / 2;
  const circ = 2 * Math.PI * radius;
  const dashOffset = circ * (1 - pct);

  const centerMain = centerValue ?? `${Math.round(pct * 100)}%`;

  return (
    <div className={styles.wrapper}>
      <div className={styles.ringBox}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={`${label ? label + ": " : ""}${centerMain}`}
        >
          <circle
            className={styles.track}
            cx={CENTER}
            cy={CENTER}
            r={radius}
            strokeWidth={thickness}
            style={trackColor ? { stroke: trackColor } : undefined}
          />
          <circle
            className={styles.progress}
            cx={CENTER}
            cy={CENTER}
            r={radius}
            strokeWidth={thickness}
            stroke={color}
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />
        </svg>
        <div className={styles.center}>
          <span className={styles.centerValue}>{centerMain}</span>
          {centerLabel && <span className={styles.centerLabel}>{centerLabel}</span>}
        </div>
      </div>
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
