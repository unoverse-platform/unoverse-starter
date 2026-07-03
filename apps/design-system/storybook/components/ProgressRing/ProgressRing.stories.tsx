import type { Meta, StoryObj } from "@storybook/react";
import ProgressRing from "./ProgressRing";
import { ProgressRingDefaults } from "./defaults";

const meta: Meta<typeof ProgressRing> = {
  title: "Components/ProgressRing",
  component: ProgressRing,
  parameters: {
    layout: "padded",
    workflowSize: { width: 280, height: 300 },
    ai: {
      description:
        "Radial gauge / donut showing a value as a filled arc of a circle, with a big center figure and caption. Reads as progress toward a goal or a share of a whole.",
      whenToUse:
        "Use for PROGRESS TOWARD A GOAL or a single proportion/percentage (quota attainment, utilization, completion). For a raw number use StatCard; for category comparison use BarChart; for change over time use TrendChart.",
    },
  },
  argTypes: {
    value: { control: "object", description: "Current value", workflowInput: true },
    max: { control: "object", description: "Value that fills the ring (default 100)", workflowInput: true },
    label: { control: "object", description: "Metric name under the ring", workflowInput: true },
    centerValue: { control: "object", description: "Override big center text (default: percent)", workflowInput: true },
    centerLabel: { control: "object", description: "Small caption under the center value", workflowInput: true },
    color: { control: "object", description: "Progress arc color", workflowInput: true },
    trackColor: { control: "object", description: "Unfilled track color", workflowInput: true },
    thickness: { control: "object", description: "Stroke thickness (viewBox units)", workflowInput: true },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: ProgressRingDefaults,
};

export const Percentage: Story = {
  args: {
    value: 72,
    max: 100,
    label: "Storage used",
    centerLabel: "of 500 GB",
    color: "var(--color-chart-3)",
  },
};

export const AtRisk: Story = {
  args: {
    value: 18,
    max: 100,
    label: "SLA compliance",
    centerLabel: "below target",
    color: "var(--color-error-500)",
  },
};
