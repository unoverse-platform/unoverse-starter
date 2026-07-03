import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import AIResponse from "./AIResponse";
import { AIResponseDefaults } from "./defaults";

const meta: Meta<typeof AIResponse> = {
  title: "Components/AIResponse",
  component: AIResponse,
  parameters: {
    layout: "padded",
    workflowSize: { width: 750, height: 400 }, // Default size for workflow editor
    // AI selection guidance — surfaced into the generated node definition and
    // ranked by the Unoverse MCP catalog. Say when to pick this vs. siblings.
    ai: {
      description:
        "Streaming conversational AI answer: markdown body (tables, links), animated thinking dots, and optional follow-up question chips.",
      whenToUse:
        "Default for chat-style AI replies that stream token-by-token. For a static rendered document or report use MarkdownRenderer; for a structured booking confirmation use BookingWidget.",
    },
  },
  argTypes: {
    progressText: {
      control: "text",
      description: "Progress/thinking message",
      workflowInput: true, // ✅ Workflow input
    },
    text: {
      control: "object",
      description: "Main response text",
      workflowInput: true, // ✅ Workflow input
    },
    questions: {
      control: "object",
      description: "Follow-up questions (array of strings)",
      workflowInput: true, // ✅ Workflow input
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: AIResponseDefaults,
};

export const WithMarkdown: Story = {
  args: AIResponseDefaults,
};

// Markdown images: a valid source renders responsively; a dead URL degrades to
// its alt text instead of a broken-image icon.
export const WithImage: Story = {
  args: {
    ...AIResponseDefaults,
    text: [
      "Here's the latest revenue trend:",
      "",
      "![Revenue chart](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80)",
      "",
      "And a source that no longer resolves — note the graceful fallback:",
      "",
      "![Quarterly forecast diagram](https://example.com/does-not-exist.png)",
    ].join("\n"),
  },
};

// Table emitted directly under a line of prose (no blank line) — the case
// markdown-to-jsx would otherwise render as literal pipes.
export const WithTable: Story = {
  args: {
    ...AIResponseDefaults,
    text: [
      "Here are the cards I found:",
      "| Card | APR | Annual Fee |",
      "| --- | --- | --- |",
      "| SAB VISA Signature | 18.9% | **SAR 0** |",
      "| SAB World | 22.4% | **SAR 750** |",
      "Let me know if you'd like to compare more.",
    ].join("\n"),
  },
};
