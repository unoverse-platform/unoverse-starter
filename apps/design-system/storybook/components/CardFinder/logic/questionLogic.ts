import { BestFitAnswers, CardFamily, QuestionOption } from "../types";
import { PRIMARY_GOAL_OPTIONS } from "../defaults";
import { BEST_FIT_QUESTIONS } from "./constants";
import { hasPremiumAccess, isCashbackOnly } from "./eligibilityLogic";

/**
 * Filter primary goal options based on eligible tiers.
 * No point showing miles/premium options if user can't get those cards.
 */
export function getFilteredPrimaryGoalOptions(eligibleTiers: CardFamily[] | undefined): QuestionOption<string>[] {
  const cashbackOnly = isCashbackOnly(eligibleTiers);
  const hasPremium = hasPremiumAccess(eligibleTiers);

  if (cashbackOnly) {
    // Only show cashback option - no point asking about miles/travel
    return PRIMARY_GOAL_OPTIONS.filter((o) => o.value === "cashback");
  }

  if (!hasPremium) {
    // No premium access - hide premium lifestyle and miles options
    return PRIMARY_GOAL_OPTIONS.filter((o) => o.value === "cashback" || o.value === "travel");
  }

  return PRIMARY_GOAL_OPTIONS;
}

/**
 * Get effective Best Fit questions based on eligibility and previous answers.
 * Skip irrelevant questions to streamline the flow.
 */
export function getEffectiveBestFitQuestions(
  eligibleTiers: CardFamily[] | undefined,
  bestFitAnswers: BestFitAnswers
): (typeof BEST_FIT_QUESTIONS)[number][] {
  const cashbackOnly = isCashbackOnly(eligibleTiers);
  const hasPremium = hasPremiumAccess(eligibleTiers);

  return BEST_FIT_QUESTIONS.filter((q) => {
    // Skip airline preference if not miles goal or no premium access
    if (q.key === "airlinePreference") {
      return bestFitAnswers.primaryGoal === "miles" && hasPremium;
    }

    // Skip travel frequency if cashback only
    if (q.key === "travelFrequency" && cashbackOnly) {
      return false;
    }

    // Skip fee tolerance if cashback only (it's free)
    if (q.key === "feeTolerance" && cashbackOnly) {
      return false;
    }

    return true;
  });
}
