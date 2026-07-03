import type { Meta, StoryObj } from "@storybook/react";
import ImageBlock from "./ImageBlock";
import { ImageBlockDefaults } from "./defaults";

const meta: Meta<typeof ImageBlock> = {
  title: "Components/ImageBlock",
  component: ImageBlock,
  parameters: {
    layout: "centered",
    workflowSize: { width: 750, height: 400 }, // Default size for workflow editor
    ai: {
      description: "Displays a single image with an optional caption.",
      whenToUse:
        "Use to show one image (photo, screenshot, generated visual) from a URL. For a clickable title+description+image promo use Card; for a swipeable set of images use CardCarousel.",
    },
  },
  argTypes: {
    image: {
      control: "text",
      description: "URL for the image",
      workflowInput: true, // ✅ Workflow input
    },
    alt: {
      control: "text",
      description: "Alt text for the image",
      workflowInput: true, // ✅ Workflow input
    },
    caption: {
      control: "text",
      description: "Optional caption shown below the image",
      workflowInput: true, // ✅ Workflow input
    },
    object: {
      control: "object",
      description: "Full object with image data (image/imageUrl, alt/title, caption)",
      workflowInput: true, // ✅ Workflow input
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImageBlock>;

export const Default: Story = {
  args: ImageBlockDefaults,
};

export const WithoutCaption: Story = {
  args: {
    ...ImageBlockDefaults,
    caption: undefined,
  },
};

export const FromObject: Story = {
  args: {
    object: ImageBlockDefaults,
  },
};
