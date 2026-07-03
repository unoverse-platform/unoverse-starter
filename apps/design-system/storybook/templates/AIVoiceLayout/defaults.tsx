/**
 * Default values for AIVoiceLayout Storybook demos
 */

import { createMockClients } from "../core";

// AIVoiceLayout doesn't render components from history - it's a voice-only template
export const { mockClientInitial } = createMockClients([]);

// Base defaults
const baseDefaults = {
  assistantName: "Aiya",
  assistantSubtitle: "AI Consultant",
  brandName: "AI Voice",
  logoUrl:
    "https://res.cloudinary.com/sonik/image/upload/w_1000,ar_1:1,c_fill,g_auto,e_art:hokusai/v1765613643/gravity/face_female.webp",
  speakingVideoUrl:
    "https://res.cloudinary.com/sonik/video/upload/v1780213101/gravity/testAvatar.mp4",
};

// Story-specific defaults
export const AIVoiceLayoutDefaults = baseDefaults;

export const AIVoiceLayoutConnected = {
  ...baseDefaults,
  _storybook_connected: true,
  _storybook_duration: 15,
};

export const AIVoiceLayoutSpeaking = {
  ...baseDefaults,
  _storybook_connected: true,
  _storybook_speaking: true,
  _storybook_duration: 42,
};

export const AIVoiceLayoutListening = {
  ...baseDefaults,
  _storybook_connected: true,
  _storybook_listening: true,
  _storybook_duration: 28,
};
