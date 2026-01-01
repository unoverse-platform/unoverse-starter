import type { Meta, StoryObj } from "@storybook/react";
import CardFinder from "./CardFinder";
import {
  initialState,
  midEligibilityState,
  eligibilityCompleteState,
  bestFitInProgressState,
  bestFitCompleteState,
  resultState,
  borderlineEligibilityState,
  lowIncomeEligibilityState,
  DEFAULT_HERO_IMAGE,
} from "./defaults";

// Note: Inline story uses initialState; other states are for focused view variations

const meta: Meta<typeof CardFinder> = {
  title: "Components/CardFinder",
  component: CardFinder,
  parameters: {
    layout: "fullscreen",
    workflowSize: { width: 900, height: 700 },
    workflowNode: {
      name: "Card Finder",
      description: "Credit card eligibility check and recommendation widget",
    },
  },
  tags: ["autodocs"],
  argTypes: {
    displayState: {
      control: "select",
      options: ["inline", "focused"],
      description: "Display mode for focus mode support",
    },
    currentPhase: {
      control: "select",
      options: ["eligibility", "best-fit", "result"],
      description: "Current phase of the eligibility flow",
    },
  },
};

export default meta;
type Story = StoryObj<typeof CardFinder>;

// ============================================
// STANDARD FOCUS MODE STATES
// All focusable components should have these
// ============================================

/**
 * Inline view - compact card shown in chat history
 */
export const Inline: Story = {
  args: {
    displayState: "inline",
    heroImage: DEFAULT_HERO_IMAGE,
    ...initialState,
  },
  parameters: {
    layout: "padded",
    workflowSize: { width: 500, height: 160 },
  },
};

/**
 * Focused view - full widget when user opens focus mode
 */
export const Focused: Story = {
  args: {
    displayState: "focused",
    heroImage: DEFAULT_HERO_IMAGE,
  },
};

// ============================================
// PHASE 1: ELIGIBILITY QUESTIONS
// ============================================

/**
 * Phase 1 - First question (Income Range)
 */
export const EligibilityQuestion1: Story = {
  args: {
    displayState: "focused",
    heroImage: DEFAULT_HERO_IMAGE,
    ...initialState,
  },
};

/**
 * Phase 1 - Mid-flow (after answering 1 question)
 */
export const EligibilityMidFlow: Story = {
  args: {
    displayState: "focused",
    heroImage: DEFAULT_HERO_IMAGE,
    ...midEligibilityState,
  },
};

/**
 * Phase 1 - Eligibility Summary (all tiers available)
 */
export const EligibilitySummaryAllTiers: Story = {
  args: {
    displayState: "focused",
    heroImage: DEFAULT_HERO_IMAGE,
    ...eligibilityCompleteState,
  },
};

/**
 * Phase 1 - Eligibility Summary (limited tiers)
 */
export const EligibilitySummaryLimited: Story = {
  args: {
    displayState: "focused",
    heroImage: DEFAULT_HERO_IMAGE,
    ...borderlineEligibilityState,
  },
};

/**
 * Phase 1 - Eligibility Summary (cashback only)
 */
export const EligibilitySummaryCashbackOnly: Story = {
  args: {
    displayState: "focused",
    heroImage: DEFAULT_HERO_IMAGE,
    ...lowIncomeEligibilityState,
  },
};

// ============================================
// PHASE 2: BEST FIT QUESTIONS
// ============================================

/**
 * Phase 2 - First question (Primary Goal)
 */
export const BestFitQuestion1: Story = {
  args: {
    displayState: "focused",
    heroImage: DEFAULT_HERO_IMAGE,
    currentPhase: "best-fit",
    currentQuestion: 0,
    eligibilityAnswers: eligibilityCompleteState.eligibilityAnswers,
    eligibleTiers: eligibilityCompleteState.eligibleTiers,
    bestFitAnswers: {},
  },
};

/**
 * Phase 2 - Mid-flow
 */
export const BestFitMidFlow: Story = {
  args: {
    displayState: "focused",
    heroImage: DEFAULT_HERO_IMAGE,
    ...bestFitInProgressState,
  },
};

// ============================================
// RESULT STATES
// ============================================

/**
 * Result - Recommended card
 */
export const Result: Story = {
  args: {
    displayState: "focused",
    heroImage: DEFAULT_HERO_IMAGE,
    ...resultState,
  },
};

/**
 * Result - With runner-up card
 */
export const ResultWithRunnerUp: Story = {
  args: {
    displayState: "focused",
    heroImage: DEFAULT_HERO_IMAGE,
    ...bestFitCompleteState,
    currentPhase: "result",
  },
};
