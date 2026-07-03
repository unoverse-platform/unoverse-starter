import type { Meta, StoryObj } from "@storybook/react";
import BarChart from "./BarChart";
import { BarChartDefaults } from "./defaults";

const meta: Meta<typeof BarChart> = {
  title: "Components/BarChart",
  component: BarChart,
  parameters: {
    layout: "padded",
    workflowSize: { width: 600, height: 360 },
    ai: {
      description:
        "Categorical bar chart (vertical or horizontal) with per-bar colors and value labels. Compares discrete categories at a glance.",
      whenToUse:
        "Use to COMPARE DISCRETE CATEGORIES (revenue by channel, count by status). For change over time use TrendChart; for a single value use StatCard; for a share of a whole / goal use ProgressRing.",
    },
  },
  argTypes: {
    data: {
      control: "object",
      description: "Array of { label, value, color? }",
      workflowInput: true,
    },
    orientation: { control: "object", description: "'vertical' | 'horizontal'", workflowInput: true },
    title: { control: "object", description: "Heading", workflowInput: true },
    max: { control: "object", description: "Force axis ceiling", workflowInput: true },
    color: { control: "object", description: "Single color for all bars", workflowInput: true },
    showValues: { control: "object", description: "Show value on each bar", workflowInput: true },
    valuePrefix: { control: "object", description: "Value prefix, e.g. $", workflowInput: true },
    valueSuffix: { control: "object", description: "Value suffix, e.g. % or k", workflowInput: true },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: BarChartDefaults,
};

export const Horizontal: Story = {
  args: {
    title: "Tickets by status",
    orientation: "horizontal",
    valuePrefix: "",
    valueSuffix: "",
    data: [
      { label: "Open", value: 124, color: "var(--color-chart-2)" },
      { label: "In progress", value: 86, color: "var(--color-chart-3)" },
      { label: "Blocked", value: 19, color: "var(--color-chart-5)" },
      { label: "Resolved", value: 203, color: "var(--color-chart-1)" },
    ],
  },
};

export const Empty: Story = {
  args: {
    title: "Revenue by channel",
    data: [],
  },
};
