/**
 * ChatLayout Template Defaults
 */

import { createMockClients } from "../core";
import AIResponse from "../../components/AIResponse/AIResponse";
import Card from "../../tempStorage/Card/Card";
import KenBurnsImage from "../../atoms/Image/KenBurnsImage";
import { AIResponseDefaults } from "../../components/AIResponse/defaults";
import { CardDefaults } from "../../components/Card/defaults";
import { KenBurnsImageDefaults } from "../../atoms/Image/defaults";
import { demoFaqs, demoActions } from "../../components/ChatInput/defaults";

// Use component defaults for suggestions (no duplication)
const defaultSuggestions = {
  faqs: demoFaqs,
  actions: demoActions,
  recommendations: [],
};

// Create all 3 states using shared factory
export const {
  mockHistoryInitial,
  mockHistoryStreaming,
  mockHistoryComplete,
  mockClientInitial,
  mockClientStreaming,
  mockClientComplete,
} = createMockClients(
  [
    { componentType: "AIResponse", Component: AIResponse, props: AIResponseDefaults },
    { componentType: "KenBurnsImage", Component: KenBurnsImage, props: KenBurnsImageDefaults },
    { componentType: "Card", Component: Card, props: CardDefaults },
  ],
  { suggestions: defaultSuggestions }
);

// Template-specific defaults
export const ChatLayoutDefaults = {
  placeholder: "Ask me anything...",
  autoScroll: true,
};
