import { CardFamily, PolicySafetyAnswers } from "../types";

/**
 * Calculate which card tiers a user is eligible for based on their answers.
 * This is the core eligibility engine that determines what cards to show.
 */
export function calculateEligibleTiers(answers: PolicySafetyAnswers): CardFamily[] {
  const { incomeRange, salaryTransfer } = answers;
  const tiers: CardFamily[] = ["cashback"]; // Always eligible for cashback

  if (incomeRange === "20000+") {
    // High income: eligible for all tiers
    tiers.push("airline-premium", "premium-travel", "mid-tier");
  } else if (incomeRange === "12000-20000") {
    // Mid-high income: premium travel + mid-tier, airline-premium with salary transfer
    tiers.push("premium-travel", "mid-tier");
    if (salaryTransfer === "yes") {
      tiers.push("airline-premium");
    }
  } else if (incomeRange === "7000-12000") {
    // Mid income: mid-tier, premium-travel with salary transfer
    tiers.push("mid-tier");
    if (salaryTransfer === "yes") {
      tiers.push("premium-travel");
    }
  }
  // <7000: only cashback (already added)

  return tiers;
}

/**
 * Check if user has access to premium/travel tiers
 */
export function hasPremiumAccess(eligibleTiers: CardFamily[] | undefined): boolean {
  return eligibleTiers?.some((t) => t === "airline-premium" || t === "premium-travel") ?? false;
}

/**
 * Check if user has access to mid-tier cards
 */
export function hasMidTierAccess(eligibleTiers: CardFamily[] | undefined): boolean {
  return eligibleTiers?.includes("mid-tier") ?? false;
}

/**
 * Check if user only qualifies for cashback cards
 */
export function isCashbackOnly(eligibleTiers: CardFamily[] | undefined): boolean {
  return eligibleTiers?.length === 1 && eligibleTiers[0] === "cashback";
}
