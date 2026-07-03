import React from "react";
import styles from "./TrendChart.module.css";

interface Series {
  /** Legend name. */
  name?: string;
  /** Line color (any CSS color). Falls back to the chart palette by index. */
  color?: string;
  /** The y-values, left → right. */
  data: number[];
}

interface TrendChartProps {
  /** Primary single series (convenience). Ignored when `series` is provided. */
  data?: number[];
  /** One or more series for a multi-line chart. Takes precedence over `data`. */
  series?: Series[];
  /** X-axis tick labels aligned to the data points. */
  labels?: string[];
  /** Heading above the chart. */
  title?: string;
  /** Color for the single-series `data` path. */
  color?: string;
  /** Fill the area under the line. Default true for a single series. */
  area?: boolean;
  /** Draw a marker dot at each point. */
  showDots?: boolean;
  /** Force the y-axis floor. Defaults to the data minimum (with headroom). */
  yMin?: number;
  /** Force the y-axis ceiling. Defaults to the data maximum (with headroom). */
  yMax?: number;
  /** Prefix on axis value labels, e.g. "$". */
  valuePrefix?: string;
  /** Suffix on axis value labels, e.g. "%". */
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

const W = 640;
const H = 280;
const PAD = { top: 16, right: 18, bottom: 30, left: 44 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

function niceNumber(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}

export default function TrendChart(props: TrendChartProps) {
  const {
    data,
    series,
    labels,
    title,
    color,
    area,
    showDots = false,
    yMin,
    yMax,
    valuePrefix = "",
    valueSuffix = "",
  } = props;

  // Normalize to a list of series. Every series is guaranteed an array `data`
  // so downstream `.length`/`.map` never throw on a malformed/partial entry
  // (e.g. a multi-series bound from upstream where one line has no data yet).
  const rawList: Series[] =
    Array.isArray(series) && series.length > 0
      ? series
      : Array.isArray(data) && data.length > 0
        ? [{ data, color }]
        : [];
  const list: Series[] = rawList.map((s) => ({
    ...s,
    data: Array.isArray(s?.data) ? s.data : [],
  }));

  const allValues = list.flatMap((s) => (Array.isArray(s.data) ? s.data : []));
  if (allValues.length === 0) {
    return (
      <div className={styles.wrapper}>
        {title && <h3 className={styles.title}>{title}</h3>}
        <div className={styles.empty}>No data to display</div>
      </div>
    );
  }

  const rawMin = yMin ?? Math.min(...allValues);
  const rawMax = yMax ?? Math.max(...allValues);
  // Headroom so the line doesn't kiss the edges.
  const pad = (rawMax - rawMin || Math.abs(rawMax) || 1) * 0.08;
  const lo = yMin ?? rawMin - pad;
  const hi = yMax ?? rawMax + pad;
  const span = hi - lo || 1;

  const maxLen = Math.max(...list.map((s) => s.data.length));
  const xAt = (i: number) => PAD.left + (maxLen > 1 ? (i / (maxLen - 1)) * PLOT_W : PLOT_W / 2);
  const yAt = (v: number) => PAD.top + (1 - (v - lo) / span) * PLOT_H;

  const GRID = 4;
  const gridLines = Array.from({ length: GRID + 1 }, (_, i) => {
    const v = hi - (i / GRID) * span;
    return { y: PAD.top + (i / GRID) * PLOT_H, value: v };
  });

  // X tick labels: thin out when crowded.
  const ticks: number[] = [];
  if (Array.isArray(labels) && labels.length > 0) {
    const n = labels.length;
    const stride = Math.max(1, Math.ceil(n / 6));
    for (let i = 0; i < n; i += stride) ticks.push(i);
    if (ticks[ticks.length - 1] !== n - 1) ticks.push(n - 1);
  }

  const singleArea = area ?? list.length === 1;

  return (
    <div className={styles.wrapper}>
      {title && <h3 className={styles.title}>{title}</h3>}

      {list.length > 1 && (
        <div className={styles.legend}>
          {list.map((s, i) => (
            <span className={styles.legendItem} key={i}>
              <span className={styles.swatch} style={{ background: s.color || PALETTE[i % PALETTE.length] }} />
              {s.name || `Series ${i + 1}`}
            </span>
          ))}
        </div>
      )}

      <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title || "Trend chart"}>
        {/* horizontal gridlines + y labels */}
        {gridLines.map((g, i) => (
          <g key={`g${i}`}>
            <line className={styles.grid} x1={PAD.left} y1={g.y} x2={W - PAD.right} y2={g.y} />
            <text className={styles.axisLabel} x={PAD.left - 8} y={g.y} textAnchor="end" dominantBaseline="middle">
              {valuePrefix}
              {niceNumber(g.value)}
              {valueSuffix}
            </text>
          </g>
        ))}

        {/* series */}
        {list.map((s, si) => {
          const c = s.color || PALETTE[si % PALETTE.length];
          const pts = s.data.map((v, i) => [xAt(i), yAt(v)] as const);
          const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
          const areaPath =
            singleArea && pts.length > 1
              ? `${line} L${pts[pts.length - 1][0].toFixed(1)},${PAD.top + PLOT_H} L${pts[0][0].toFixed(1)},${
                  PAD.top + PLOT_H
                } Z`
              : null;
          return (
            <g key={`s${si}`}>
              {areaPath && <path d={areaPath} fill={c} className={styles.area} />}
              <path d={line} fill="none" stroke={c} className={styles.line} />
              {showDots &&
                pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} fill={c} className={styles.dot} />)}
            </g>
          );
        })}

        {/* x labels */}
        {ticks.map((i) => (
          <text
            key={`x${i}`}
            className={styles.axisLabel}
            x={xAt(i)}
            y={H - PAD.bottom + 18}
            textAnchor="middle"
          >
            {labels![i]}
          </text>
        ))}
      </svg>
    </div>
  );
}
