import type { Meta, StoryObj } from "@storybook/react";
import MetricGrid from "./MetricGrid";
import { MetricGridDefaults } from "./defaults";

const meta: Meta<typeof MetricGrid> = {
  title: "Components/MetricGrid",
  component: MetricGrid,
  parameters: {
    layout: "padded",
    workflowSize: { width: 820, height: 240 },
    ai: {
      description:
        "Responsive grid of KPI tiles — each with label, value (prefix/suffix), and an auto-colored up/down delta. The summary strip at the top of a dashboard.",
      whenToUse:
        "Use when showing SEVERAL headline KPIs together. For a single metric use StatCard; for a metric over time use TrendChart; for category comparison use BarChart; for progress toward a goal use ProgressRing.",
    },
  },
  argTypes: {
    metrics: {
      control: "object",
      description: "Array of { label, value, prefix, suffix, delta, invertDelta, icon, accentColor }",
      workflowInput: true,
    },
    title: { control: "object", description: "Optional heading above the grid", workflowInput: true },
    columns: { control: "object", description: "Fixed column count (omit for responsive)", workflowInput: true },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: MetricGridDefaults,
};

export const TwoColumns: Story = {
  args: {
    ...MetricGridDefaults,
    title: "Acquisition",
    columns: 2,
    metrics: MetricGridDefaults.metrics.slice(0, 2),
  },
};

export const Empty: Story = {
  args: {
    title: "This month at a glance",
    metrics: [],
  },
};
