import React from "react";
import styles from "./BarChart.module.css";

interface Bar {
  /** Category name. */
  label?: string;
  /** Numeric value. */
  value?: number;
  /** Per-bar color (any CSS color). Falls back to the chart palette by index. */
  color?: string;
}

interface BarChartProps {
  /** The bars to plot. */
  data?: Bar[];
  /** Layout: bars grow upward ("vertical") or rightward ("horizontal"). */
  orientation?: "vertical" | "horizontal";
  /** Heading above the chart. */
  title?: string;
  /** Force the axis ceiling. Defaults to the largest value. */
  max?: number;
  /** Single color applied to every bar (per-bar `color` still wins). */
  color?: string;
  /** Show the numeric value on each bar. Default true. */
  showValues?: boolean;
  /** Prefix on value labels, e.g. "$". */
  valuePrefix?: string;
  /** Suffix on value labels, e.g. "%". */
  valueSuffix?: string;
}

const PALETTE = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
];

function fmt(v: number, prefix: string, suffix: string): string {
  const n = Number.isInteger(v) ? String(v) : v.toFixed(1);
  return `${prefix}${n}${suffix}`;
}

export default function BarChart(props: BarChartProps) {
  const {
    data,
    orientation = "vertical",
    title,
    max,
    color,
    showValues = true,
    valuePrefix = "",
    valueSuffix = "",
  } = props;

  const bars = Array.isArray(data) ? data.filter((b) => b && typeof b.value === "number") : [];

  if (bars.length === 0) {
    return (
      <div className={styles.wrapper}>
        {title && <h3 className={styles.title}>{title}</h3>}
        <div className={styles.empty}>No data to display</div>
      </div>
    );
  }

  const ceiling = max ?? (Math.max(...bars.map((b) => b.value as number), 0) || 1);
  const colorFor = (b: Bar, i: number) => b.color || color || PALETTE[i % PALETTE.length];

  return (
    <div className={styles.wrapper}>
      {title && <h3 className={styles.title}>{title}</h3>}

      {orientation === "horizontal" ? (
        <div className={styles.hChart}>
          {bars.map((b, i) => {
            const pct = Math.max(0, Math.min(100, ((b.value as number) / ceiling) * 100));
            return (
              <div className={styles.hRow} key={i}>
                <span className={styles.hLabel} title={b.label}>
                  {b.label}
                </span>
                <div className={styles.hTrack}>
                  <div className={styles.hBar} style={{ width: `${pct}%`, background: colorFor(b, i) }} />
                </div>
                {showValues && (
                  <span className={styles.hValue}>{fmt(b.value as number, valuePrefix, valueSuffix)}</span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className={styles.vChart}>
          {bars.map((b, i) => {
            const pct = Math.max(0, Math.min(100, ((b.value as number) / ceiling) * 100));
            return (
              <div className={styles.vCol} key={i}>
                {showValues && (
                  <span className={styles.vValue}>{fmt(b.value as number, valuePrefix, valueSuffix)}</span>
                )}
                <div className={styles.vTrack}>
                  <div className={styles.vBar} style={{ height: `${pct}%`, background: colorFor(b, i) }} />
                </div>
                <span className={styles.vLabel} title={b.label}>
                  {b.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
