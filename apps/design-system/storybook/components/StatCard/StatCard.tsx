import React from "react";
import styles from "./StatCard.module.css";

type DeltaDirection = "up" | "down" | "neutral";

interface Delta {
  /** Magnitude of change, e.g. 12.4 or "12.4%". Sign infers direction when `direction` is omitted. */
  value?: number | string;
  /** Explicit arrow direction. Inferred from a numeric `value` sign when omitted. */
  direction?: DeltaDirection;
  /** Small qualifier under/after the delta, e.g. "vs last week". */
  label?: string;
}

interface StatCardProps {
  /** Metric name, e.g. "Monthly Revenue". */
  label?: string;
  /** The headline number — pre-formatted string or raw number. */
  value?: number | string;
  /** Optional prefix glued to the value, e.g. "$". */
  prefix?: string;
  /** Optional suffix glued to the value, e.g. "%", "ms". */
  suffix?: string;
  /** Period-over-period change. */
  delta?: Delta;
  /** When true, a downward delta is "good" (green) — for cost, churn, latency. */
  invertDelta?: boolean;
  /** Sparkline series (raw numbers). Renders a tiny inline trend when length >= 2. */
  sparkline?: number[];
  /** Small leading glyph (emoji or 1–2 chars). Decorative. */
  icon?: string;
  /** Muted helper line under the value, e.g. "Updated 2m ago". */
  caption?: string;
  /** Accent color for icon + sparkline. Any CSS color; defaults to the chart-1 token. */
  accentColor?: string;
}

/** Direction → sentiment, honouring invertDelta (up is "good" unless inverted). */
function sentimentFor(direction: DeltaDirection, invert: boolean): "positive" | "negative" | "neutral" {
  if (direction === "neutral") return "neutral";
  const good = invert ? "down" : "up";
  return direction === good ? "positive" : "negative";
}

function resolveDirection(delta?: Delta): DeltaDirection {
  if (!delta) return "neutral";
  if (delta.direction) return delta.direction;
  const n = typeof delta.value === "number" ? delta.value : parseFloat(String(delta.value ?? ""));
  if (!Number.isFinite(n) || n === 0) return "neutral";
  return n > 0 ? "up" : "down";
}

/** Build a normalized sparkline polyline + area path over a fixed viewBox. */
function sparklinePaths(series: number[], w: number, h: number, pad: number) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const step = series.length > 1 ? (w - pad * 2) / (series.length - 1) : 0;
  const points = series.map((v, i) => {
    const x = pad + i * step;
    const y = pad + (1 - (v - min) / span) * (h - pad * 2);
    return [x, y] as const;
  });
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${points[points.length - 1][0].toFixed(1)},${h} L${points[0][0].toFixed(1)},${h} Z`;
  return { line, area };
}

const ARROW: Record<DeltaDirection, string> = { up: "▲", down: "▼", neutral: "→" };

export default function StatCard(props: StatCardProps) {
  const {
    label,
    value,
    prefix,
    suffix,
    delta,
    invertDelta = false,
    sparkline,
    icon,
    caption,
    accentColor,
  } = props;

  const direction = resolveDirection(delta);
  const sentiment = sentimentFor(direction, invertDelta);
  const hasDelta = !!delta && (delta.value !== undefined || !!delta.direction);
  const hasSpark = Array.isArray(sparkline) && sparkline.length >= 2;

  const accentStyle = accentColor ? ({ ["--statcard-accent" as any]: accentColor } as React.CSSProperties) : undefined;

  const W = 120;
  const H = 36;
  const paths = hasSpark ? sparklinePaths(sparkline as number[], W, H, 3) : null;

  return (
    <div className={styles.card} style={accentStyle}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        {icon && (
          <span className={styles.icon} aria-hidden="true">
            {icon}
          </span>
        )}
      </div>

      <div className={styles.valueRow}>
        <span className={styles.value}>
          {prefix && <span className={styles.affix}>{prefix}</span>}
          {value ?? "—"}
          {suffix && <span className={styles.affix}>{suffix}</span>}
        </span>
      </div>

      <div className={styles.footer}>
        {hasDelta && (
          <span className={`${styles.delta} ${styles[sentiment]}`}>
            <span className={styles.arrow} aria-hidden="true">
              {ARROW[direction]}
            </span>
            {delta?.value !== undefined && <span className={styles.deltaValue}>{delta.value}</span>}
            {delta?.label && <span className={styles.deltaLabel}>{delta.label}</span>}
          </span>
        )}
        {!hasDelta && caption && <span className={styles.caption}>{caption}</span>}

        {hasSpark && paths && (
          <svg className={styles.spark} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
            <path className={styles.sparkArea} d={paths.area} />
            <path className={styles.sparkLine} d={paths.line} />
          </svg>
        )}
      </div>

      {hasDelta && caption && <div className={styles.caption}>{caption}</div>}
    </div>
  );
}
