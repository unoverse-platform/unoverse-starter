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
    // AI selection guidance — surfaced into the generated node definition and
    // ranked by the Unoverse MCP catalog. Say when to pick this vs. siblings.
    ai: {
      description:
        "Renders a standalone markdown document or report with an optional title and a 'Writing…' streaming indicator.",
      whenToUse:
        "Pick for static or streamed long-form content — documents, reports, summaries. For interactive chat replies with follow-up questions use AIResponse instead.",
    },
  },
  argTypes: {
    title: {
      control: "object",
      description: "Optional title shown above the rendered markdown",
      workflowInput: true,
    },
    markdown: {
      control: "object",
      description: "Markdown content to render",
      workflowInput: true,
    },
    streamingState: {
      control: "object",
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

// Markdown images: a valid source renders responsively; a dead URL degrades to
// its alt text instead of a broken-image icon.
export const WithImage: Story = {
  args: {
    title: "Emirates GTM Financial Dashboard",
    markdown: [
      "## Revenue trend",
      "",
      "![Revenue chart](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80)",
      "",
      "Record revenue of **AED 244 billion** in 2025-26.",
      "",
      "### Broken source (graceful fallback)",
      "",
      "![Quarterly forecast diagram](https://example.com/does-not-exist.png)",
    ].join("\n"),
  },
};
