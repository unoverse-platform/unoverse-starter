import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import MarkdownRenderer from "./MarkdownRenderer";
import {
  MarkdownRendererDefaults,
  MarkdownRendererLongDocDefaults,
  MarkdownRendererEdgeCasesDefaults,
} from "./defaults";

const meta: Meta<typeof MarkdownRenderer> = {
  title: "Components/MarkdownRenderer",
  component: MarkdownRenderer,
  parameters: {
    layout: "padded",
    workflowSize: { width: 750, height: 500 },
  },
  argTypes: {
    title: {
      control: "text",
      description: "Optional title shown above the rendered markdown",
      workflowInput: true,
    },
    markdown: {
      control: "text",
      description: "Markdown content to render",
      workflowInput: true,
    },
    streamingState: {
      control: "select",
      options: ["idle", "streaming", "complete"],
      description: "Controls the 'Writing…' indicator",
      workflowInput: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: MarkdownRendererDefaults,
};

export const LongDoc: Story = {
  args: MarkdownRendererLongDocDefaults,
};

export const Streaming: Story = {
  args: {
    ...MarkdownRendererLongDocDefaults,
    streamingState: "streaming",
  },
};

export const EdgeCases: Story = {
  args: MarkdownRendererEdgeCasesDefaults,
};
