import type { Meta, StoryObj } from "@storybook/react";
import TrendChart from "./TrendChart";
import { TrendChartDefaults } from "./defaults";

const meta: Meta<typeof TrendChart> = {
  title: "Components/TrendChart",
  component: TrendChart,
  parameters: {
    layout: "padded",
    workflowSize: { width: 640, height: 380 },
    ai: {
      description:
        "Pure-SVG time-series line/area chart with gridlines and axis labels. Supports a single series or several overlaid lines with a legend.",
      whenToUse:
        "Use to show how a metric MOVES OVER TIME (trend, growth, time series). For a single current value use StatCard; for comparing discrete categories use BarChart; for progress toward a goal use ProgressRing.",
    },
  },
  argTypes: {
    data: { control: "object", description: "Single series: array of numbers", workflowInput: true },
    series: {
      control: "object",
      description: "Multi-line: array of { name, color, data:number[] } (overrides `data`)",
      workflowInput: true,
    },
    labels: { control: "object", description: "X-axis tick labels", workflowInput: true },
    title: { control: "object", description: "Heading", workflowInput: true },
    color: { control: "object", description: "Line color for single series", workflowInput: true },
    area: { control: "object", description: "Fill area under the line", workflowInput: true },
    showDots: { control: "object", description: "Draw a dot at each point", workflowInput: true },
    yMin: { control: "object", description: "Force y-axis floor", workflowInput: true },
    yMax: { control: "object", description: "Force y-axis ceiling", workflowInput: true },
    valuePrefix: { control: "object", description: "Axis value prefix, e.g. $", workflowInput: true },
    valueSuffix: { control: "object", description: "Axis value suffix, e.g. % or k", workflowInput: true },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: TrendChartDefaults,
};

export const MultiSeries: Story = {
  args: {
    title: "Sessions by platform",
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    valueSuffix: "k",
    series: [
      { name: "Web", color: "var(--color-chart-2)", data: [12, 14, 13, 17, 16, 9, 8] },
      { name: "iOS", color: "var(--color-chart-1)", data: [8, 9, 11, 10, 12, 14, 13] },
      { name: "Android", color: "var(--color-chart-3)", data: [5, 6, 6, 7, 8, 10, 9] },
    ],
  },
};

export const WithDots: Story = {
  args: {
    ...TrendChartDefaults,
    title: "Conversion rate",
    valuePrefix: "",
    valueSuffix: "%",
    data: [2.8, 3.0, 2.9, 3.3, 3.5, 3.4, 3.8],
    labels: ["W1", "W2", "W3", "W4", "W5", "W6", "W7"],
    showDots: true,
    color: "var(--color-chart-4)",
  },
};

export const Empty: Story = {
  args: {
    title: "Revenue — last 12 weeks",
    data: [],
  },
};
