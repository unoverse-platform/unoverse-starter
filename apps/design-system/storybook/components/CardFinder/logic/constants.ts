import { CardFamily } from "../types";

// Question definitions for Phase 1: Eligibility
export const ELIGIBILITY_QUESTIONS = [
  {
    key: "incomeRange",
    question: "What is your monthly income?",
    subtitle: "This helps us find cards you qualify for",
  },
  {
    key: "salaryTransfer",
    question: "Is your salary transferred to SAB?",
    subtitle: "This can unlock more options",
  },
  {
    key: "residency",
    question: "What is your residency status?",
    subtitle: "Saudi Arabia",
  },
] as const;

// Question definitions for Phase 2: Best Fit
export const BEST_FIT_QUESTIONS = [
  {
    key: "primaryGoal",
    question: "What is your primary goal?",
    subtitle: "Choose what matters most to you",
  },
  {
    key: "airlinePreference",
    question: "Do you have an airline preference?",
    subtitle: "For earning miles",
    conditional: true,
  },
  {
    key: "travelFrequency",
    question: "How often do you travel?",
    subtitle: "Flights per year",
  },
  {
    key: "feeTolerance",
    question: "Annual fee preference?",
    subtitle: "How much are you willing to pay?",
  },
] as const;

// Tier display labels
export const TIER_LABELS: Record<CardFamily, string> = {
  "airline-premium": "Premium Airline Cards",
  "premium-travel": "Premium Travel Cards",
  "mid-tier": "Travel Essentials",
  cashback: "Cashback Cards",
};

// Tier display order (top to bottom)
export const TIER_ORDER: CardFamily[] = ["airline-premium", "premium-travel", "mid-tier", "cashback"];
