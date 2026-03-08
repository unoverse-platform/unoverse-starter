import type { Meta, StoryObj } from "@storybook/react";
import MiskHubChatLayout from "./MiskHubChatLayout";
import { mockClientInitial, mockClientStreaming, mockClientComplete, MiskHubChatLayoutDefaults } from "./defaults";

const meta: Meta<typeof MiskHubChatLayout> = {
  title: "Templates/MiskHubChatLayout",
  component: MiskHubChatLayout,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div style={{ height: "100vh", width: "100vw" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text for input",
    },
    autoScroll: {
      control: "boolean",
      description: "Auto-scroll to bottom on new content",
    },
    brandName: {
      control: "text",
      description: "Brand name displayed in welcome screen",
    },
    brandSubtitle: {
      control: "text",
      description: "Subtitle displayed in welcome screen",
    },
    logoUrl: {
      control: "text",
      description: "URL for brand logo",
    },
  },
};

export default meta;
type Story = StoryObj<typeof MiskHubChatLayout>;

// Initial - User just opened the chat (shows welcome screen)
export const Initial: Story = {
  args: {
    client: mockClientInitial,
    ...MiskHubChatLayoutDefaults,
  },
};

// Streaming - AI is working, components updating
export const Streaming: Story = {
  args: {
    client: mockClientStreaming,
    ...MiskHubChatLayoutDefaults,
  },
};

// Complete - All components rendered and hydrated
export const Complete: Story = {
  args: {
    client: mockClientComplete,
    ...MiskHubChatLayoutDefaults,
  },
};

// Focus Mode - Component is focused, shows pill in input
export const FocusMode: Story = {
  args: {
    client: {
      ...mockClientComplete,
      focusState: {
        focusedComponentId: "comp-1",
        targetTriggerNode: "inputtrigger6",
        chatId: "chat-123",
        agentName: "Career Advisor",
      },
      closeFocus: () => console.log("[Mock] Close focus"),
    },
    ...MiskHubChatLayoutDefaults,
  },
};
