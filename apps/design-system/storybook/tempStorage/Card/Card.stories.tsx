import type { Meta, StoryObj } from "@storybook/react";
import Card from "./Card";
import { CardDefaults } from "./defaults";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
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
      description: "Full object with card data (title, description, imageUrl/image, cta/callToAction)",
      workflowInput: true, // ✅ Workflow input
    },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: CardDefaults,
};

export const WithoutImage: Story = {
  args: {
    ...CardDefaults,
    image: undefined,
  },
};

export const WithoutCTA: Story = {
  args: {
    ...CardDefaults,
    callToAction: undefined,
  },
};

export const FromObject: Story = {
  args: {
    object: CardDefaults,
  },
};
