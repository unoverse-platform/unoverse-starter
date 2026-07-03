import type { Meta, StoryObj } from "@storybook/react";
import Card2 from "./Card2";
import { Card2Defaults } from "./defaults";

const meta: Meta<typeof Card2> = {
  title: "Components/Card2",
  component: Card2,
  parameters: {
    layout: "centered",
    workflowSize: { width: 750, height: 400 }, // Default size for workflow editor
  },
  argTypes: {
    title: {
      control: "text",
      description: "Card title",
      workflowInput: true, // ✅ Workflow input
    },
    description: {
      control: "text",
      description: "Card description text",
      workflowInput: true, // ✅ Workflow input
    },
    image: {
      control: "text",
      description: "URL for card image",
      workflowInput: true, // ✅ Workflow input
    },
    callToAction: {
      control: "text",
      description: "Call to action button text",
      workflowInput: true, // ✅ Workflow input
    },
    object: {
      control: "object",
      description: "Full object with card data (title, description, imageUrl/image, callToAction)",
      workflowInput: true, // ✅ Workflow input
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card2>;

export const Default: Story = {
  args: Card2Defaults,
};

export const WithoutImage: Story = {
  args: {
    ...Card2Defaults,
    image: undefined,
  },
};

export const WithoutCTA: Story = {
  args: {
    ...Card2Defaults,
    callToAction: undefined,
  },
};

export const FromObject: Story = {
  args: {
    object: Card2Defaults,
  },
};

export const LongContent: Story = {
  args: {
    ...Card2Defaults,
    description:
      "Improve your swing with AI-powered analysis and personalized coaching. Get real-time feedback and track your progress over time. Our advanced algorithms analyze every aspect of your swing, from grip to follow-through, providing detailed insights and actionable recommendations.",
  },
};
