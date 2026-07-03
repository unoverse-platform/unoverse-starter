import type { Meta, StoryObj } from "@storybook/react";
import BookingWidget from "./BookingWidget";
import { defaultBookingData } from "./defaults";

const meta: Meta<typeof BookingWidget> = {
  title: "Components/BookingWidget",
  component: BookingWidget,
  parameters: {
    layout: "fullscreen",
    workflowSize: { width: 750, height: 400 }, // Default size for workflow editor
    // AI selection guidance — surfaced into the generated node definition and
    // ranked by the Unoverse MCP catalog. Say when to pick this vs. siblings.
    ai: {
      description:
        "Structured booking card showing travel/reservation details with confirm, edit, and cancel actions.",
      whenToUse:
        "Pick when presenting a concrete booking or reservation the user confirms or edits. For free-form AI answers use AIResponse; for plain documents use MarkdownRenderer.",
    },
  },
  tags: ["autodocs"],
  argTypes: {
    bookingData: {
      control: "object",
      description: "Booking information to display",
      workflowInput: true, // ✅ Workflow input - data from AI
    },
    editable: {
      control: "boolean",
      description: "Whether the booking can be edited",
      workflowInput: false, // ❌ Template prop - wired by template
    },
    onBookingChange: {
      action: "booking changed",
      workflowInput: false, // ❌ Template prop - callback
    },
    onConfirm: {
      action: "booking confirmed",
      workflowInput: false, // ❌ Template prop - callback
    },
    onCancel: {
      action: "booking cancelled",
      workflowInput: false, // ❌ Template prop - callback
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Main booking - pending confirmation
export const Default: Story = {
  args: {
    bookingData: defaultBookingData,
    editable: true,
  },
};

// Confirmed booking - read-only
export const Confirmed: Story = {
  args: {
    bookingData: {
      ...defaultBookingData,
      status: "confirmed",
    },
    editable: false,
  },
};
