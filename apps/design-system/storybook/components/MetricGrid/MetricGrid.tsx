import React from "react";
import styles from "./MetricGrid.module.css";

type DeltaDirection = "up" | "down" | "neutral";

interface Delta {
  value?: number | string;
  direction?: DeltaDirection;
  label?: string;
}

interface Metric {
  /** Metric name. */
  label?: string;
  /** Headline value. */
  value?: number | string;
  /** Glued before the value, e.g. "$". */
  prefix?: string;
  /** Glued after the value, e.g. "%". */
  suffix?: string;
  /** Period-over-period change. */
  delta?: Delta;
  /** When true a downward delta is "good" (cost, churn, latency). */
  invertDelta?: boolean;
  /** Decorative leading glyph. */
  icon?: string;
  /** Accent CSS color for the icon. */
  accentColor?: string;
}

interface MetricGridProps {
  /** The KPIs to display as a responsive grid of tiles. */
  metrics?: Metric[];
  /** Optional heading above the grid. */
  title?: string;
  /** Fixed column count. Omit for responsive auto-fit. */
  columns?: number;
}

function resolveDirection(delta?: Delta): DeltaDirection {
  if (!delta) return "neutral";
  if (delta.direction) return delta.direction;
  const n = typeof delta.value === "number" ? delta.value : parseFloat(String(delta.value ?? ""));
  if (!Number.isFinite(n) || n === 0) return "neutral";
  return n > 0 ? "up" : "down";
}

function sentimentFor(direction: DeltaDirection, invert: boolean): "positive" | "negative" | "neutral" {
  if (direction === "neutral") return "neutral";
  const good = invert ? "down" : "up";
  return direction === good ? "positive" : "negative";
}

const ARROW: Record<DeltaDirection, string> = { up: "▲", down: "▼", neutral: "→" };

export default function MetricGrid(props: MetricGridProps) {
  const { metrics, title, columns } = props;
  const items = Array.isArray(metrics) ? metrics : [];

  const gridStyle: React.CSSProperties = columns
    ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
    : {};

  if (items.length === 0) {
    return (
      <div className={styles.wrapper}>
        {title && <h3 className={styles.title}>{title}</h3>}
        <div className={styles.empty}>No metrics to display</div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.grid} style={gridStyle}>
        {items.map((m, i) => {
          const direction = resolveDirection(m.delta);
          const sentiment = sentimentFor(direction, !!m.invertDelta);
          const hasDelta = !!m.delta && (m.delta.value !== undefined || !!m.delta.direction);
          const accentStyle = m.accentColor
            ? ({ ["--metric-accent" as any]: m.accentColor } as React.CSSProperties)
            : undefined;
          return (
            <div className={styles.tile} key={i} style={accentStyle}>
              <div className={styles.tileHead}>
                <span className={styles.label}>{m.label}</span>
                {m.icon && (
                  <span className={styles.icon} aria-hidden="true">
                    {m.icon}
                  </span>
                )}
              </div>
              <div className={styles.value}>
                {m.prefix && <span className={styles.affix}>{m.prefix}</span>}
                {m.value ?? "—"}
                {m.suffix && <span className={styles.affix}>{m.suffix}</span>}
              </div>
              {hasDelta && (
                <span className={`${styles.delta} ${styles[sentiment]}`}>
                  <span className={styles.arrow} aria-hidden="true">
                    {ARROW[direction]}
                  </span>
                  {m.delta?.value !== undefined && <span className={styles.deltaValue}>{m.delta.value}</span>}
                  {m.delta?.label && <span className={styles.deltaLabel}>{m.delta.label}</span>}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
