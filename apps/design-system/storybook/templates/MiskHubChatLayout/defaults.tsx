/**
 * MiskHubChatLayout Template Defaults
 * Following the 3-state pattern: Initial, Streaming, Complete
 */

import { createMockClients } from "../core";
import AIResponse from "../../components/AIResponse/AIResponse";
import Card from "../../components/Card/Card";
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
export const MiskHubChatLayoutDefaults = {
  placeholder: "Ask about programs, careers, or opportunities...",
  autoScroll: true,
  brandName: "Misk Hub",
  brandSubtitle: "Empowering Saudi youth through learning and opportunity",
  logoUrl: "",
  suggestions: [
    {
      icon: "academicCap",
      title: "Learning Programs",
      question: "What educational programs are available for graduates?",
    },
    {
      icon: "rocket",
      title: "Entrepreneurship",
      question: "How can I launch my startup with Misk support?",
    },
    {
      icon: "briefcase",
      title: "Career Development",
      question: "What career resources are available for young professionals?",
    },
    {
      icon: "userGroup",
      title: "Community",
      question: "How do I connect with other young leaders in the Misk network?",
    },
  ],
};
