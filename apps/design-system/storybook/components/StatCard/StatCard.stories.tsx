import type { Meta, StoryObj } from "@storybook/react";
import StatCard from "./StatCard";
import { StatCardDefaults } from "./defaults";

const meta: Meta<typeof StatCard> = {
  title: "Components/StatCard",
  component: StatCard,
  parameters: {
    layout: "padded",
    workflowSize: { width: 320, height: 200 },
    ai: {
      description:
        "Single KPI tile: a large headline value with prefix/suffix, an up/down delta vs the prior period (auto-colored green/red), an optional inline sparkline, an icon and a caption.",
      whenToUse:
        "Use for ONE headline metric. For several KPIs side-by-side use MetricGrid; for a metric over time use TrendChart; for category comparison use BarChart; for progress toward a goal use ProgressRing.",
    },
  },
  argTypes: {
    label: { control: "object", description: "Metric name", workflowInput: true },
    value: { control: "object", description: "Headline value (string or number)", workflowInput: true },
    prefix: { control: "object", description: "Value prefix, e.g. $", workflowInput: true },
    suffix: { control: "object", description: "Value suffix, e.g. % or ms", workflowInput: true },
    delta: {
      control: "object",
      description: "Change: { value, direction: 'up'|'down'|'neutral', label }",
      workflowInput: true,
    },
    invertDelta: {
      control: "object",
      description: "When true a downward delta is good (cost, churn, latency)",
      workflowInput: true,
    },
    sparkline: { control: "object", description: "Trend series (array of numbers)", workflowInput: true },
    icon: { control: "object", description: "Leading glyph (emoji / 1–2 chars)", workflowInput: true },
    caption: { control: "object", description: "Muted helper line", workflowInput: true },
    accentColor: { control: "object", description: "Accent CSS color for icon + sparkline", workflowInput: true },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: StatCardDefaults,
};

export const NegativeDelta: Story = {
  args: {
    label: "Active Sessions",
    value: "1,204",
    delta: { value: "-8.1%", direction: "down", label: "vs yesterday" },
    sparkline: [62, 58, 60, 55, 49, 47, 44, 41],
    icon: "👥",
    accentColor: "var(--color-chart-2)",
  },
};

// Inverted: latency falling is good → green despite a downward arrow.
export const InvertedGoodWhenDown: Story = {
  args: {
    label: "p95 Latency",
    value: "186",
    suffix: "ms",
    invertDelta: true,
    delta: { value: "-14%", direction: "down", label: "vs last hour" },
    sparkline: [240, 232, 221, 215, 208, 199, 192, 186],
    icon: "⚡",
    accentColor: "var(--color-chart-3)",
  },
};

export const Minimal: Story = {
  args: {
    label: "Conversion Rate",
    value: "3.8",
    suffix: "%",
    caption: "Last 30 days",
  },
};
