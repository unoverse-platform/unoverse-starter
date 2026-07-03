import type { Meta, StoryObj } from "@storybook/react";
import AIVoiceLayout from "./AIVoiceLayout";
import {
  mockClientInitial,
  AIVoiceLayoutDefaults,
  AIVoiceLayoutConnected,
  AIVoiceLayoutSpeaking,
  AIVoiceLayoutListening,
} from "./defaults";

const meta: Meta<typeof AIVoiceLayout> = {
  title: "Templates/AIVoiceLayout",
  component: AIVoiceLayout,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div style={{ height: "100vh" }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    _storybook_connected: {
      control: "boolean",
      description: "Whether the call is connected",
    },
    _storybook_speaking: {
      control: "boolean",
      description: "Whether the assistant is speaking",
    },
    _storybook_listening: {
      control: "boolean",
      description: "Whether the user is speaking",
    },
    assistantName: {
      control: "text",
      description: "Name displayed for the AI assistant",
    },
    assistantSubtitle: {
      control: "text",
      description: "Subtitle displayed under assistant name",
    },
    logoUrl: {
      control: "text",
      description: "URL for assistant avatar image",
    },
    speakingVideoUrl: {
      control: "text",
      description: "URL for speaking video animation",
    },
    brandName: {
      control: "text",
      description: "Brand name displayed in header",
    },
  },
};

export default meta;
type Story = StoryObj<typeof AIVoiceLayout>;

/** Idle - ready to start call */
export const Idle: Story = {
  args: { client: mockClientInitial, ...AIVoiceLayoutDefaults },
};

/** Connected - call active */
export const Connected: Story = {
  args: { client: mockClientInitial, ...AIVoiceLayoutConnected },
};

/** Speaking - assistant is talking */
export const Speaking: Story = {
  args: { client: mockClientInitial, ...AIVoiceLayoutSpeaking },
};

/** Listening - user is speaking, mic active */
export const Listening: Story = {
  args: { client: mockClientInitial, ...AIVoiceLayoutListening },
};
