import { BestFitAnswers, CardFamily, CardRecommendation } from "../types";
import { SAB_CARDS, getCardById } from "../cardData";

interface RecommendationResult {
  recommended: CardRecommendation;
  runnerUp: CardRecommendation;
}

/**
 * Calculate card recommendations based on user preferences and eligible tiers.
 * This is a simplified rule-based engine - AI will enhance this later.
 */
export function calculateRecommendations(
  bestFitAnswers: BestFitAnswers,
  eligibleTiers: CardFamily[] | undefined
): RecommendationResult {
  const { primaryGoal, airlinePreference, travelFrequency, feeTolerance } = bestFitAnswers;
  const tiers = eligibleTiers || ["cashback"];

  let recommendedId = "sab_visa_cashback";
  let runnerUpId = "sab_visa_platinum";
  let fitScore = 75;
  const fitReasons: string[] = [];

  // Check tier access
  const canGetPremium = tiers.includes("airline-premium") || tiers.includes("premium-travel");
  const canGetMidTier = tiers.includes("mid-tier");

  // Airline miles goal with preference
  if (primaryGoal === "miles" && canGetPremium) {
    if (airlinePreference === "emirates" && tiers.includes("airline-premium")) {
      recommendedId = "sab_emirates_visa_infinite";
      runnerUpId = "sab_visa_signature";
      fitScore = 95;
      fitReasons.push("Perfect match for Emirates Skywards miles earning");
    } else if (airlinePreference === "saudia" && tiers.includes("airline-premium")) {
      recommendedId = "sab_alfursan_black_mastercard";
      runnerUpId = "sab_premier_mastercard";
      fitScore = 95;
      fitReasons.push("Ideal for AlFursan miles with SAUDIA");
    } else if (tiers.includes("premium-travel")) {
      recommendedId = "sab_visa_signature";
      runnerUpId = canGetMidTier ? "sab_visa_platinum" : "sab_visa_cashback";
      fitScore = 85;
      fitReasons.push("Flexible travel rewards without airline lock-in");
    }
  }
  // Travel perks goal
  else if (primaryGoal === "travel") {
    if (canGetPremium && feeTolerance === "high") {
      recommendedId = "sab_premier_mastercard";
      runnerUpId = "sab_visa_signature";
      fitScore = 90;
      fitReasons.push("Unlimited lounge access for frequent travelers");
    } else if (canGetPremium) {
      recommendedId = "sab_visa_signature";
      runnerUpId = canGetMidTier ? "sab_visa_platinum" : "sab_visa_cashback";
      fitScore = 85;
      fitReasons.push("Strong travel benefits at moderate cost");
    } else if (canGetMidTier) {
      recommendedId = "sab_visa_platinum";
      runnerUpId = "sab_visa_cashback";
      fitScore = 80;
      fitReasons.push("Good travel perks within your eligibility");
    }
  }
  // Premium lifestyle goal
  else if (primaryGoal === "premium" && canGetPremium) {
    if (tiers.includes("airline-premium")) {
      recommendedId = "sab_emirates_visa_infinite";
      runnerUpId = "sab_premier_mastercard";
      fitScore = 88;
      fitReasons.push("Premium concierge and lifestyle benefits");
    } else {
      recommendedId = "sab_premier_mastercard";
      runnerUpId = "sab_visa_signature";
      fitScore = 85;
      fitReasons.push("Premium benefits within your eligibility");
    }
  }
  // Cashback goal or fallback
  else {
    recommendedId = "sab_visa_cashback";
    runnerUpId = canGetMidTier ? "sab_visa_platinum" : "sab_visa_cashback";
    fitScore = 92;
    fitReasons.push("Free for life with up to 10% cashback");
  }

  // Add travel frequency reason
  if (travelFrequency === "10+" || travelFrequency === "5-10") {
    fitReasons.push("Lounge access matches your travel frequency");
  } else if (travelFrequency === "2-4") {
    fitReasons.push("Good lounge access for regular travelers");
  }

  // Add fee tolerance reason
  if (feeTolerance === "low" && recommendedId !== "sab_visa_cashback") {
    fitScore -= 10;
    fitReasons.push("Consider cashback card for lower fees");
  } else if (feeTolerance === "high" && canGetPremium) {
    fitReasons.push("Premium perks align with your fee tolerance");
  }

  const recommended = getCardById(recommendedId) || SAB_CARDS[0];
  const runnerUp = getCardById(runnerUpId) || SAB_CARDS[1];

  return {
    recommended: { card: recommended, fitScore, fitReasons },
    runnerUp: { card: runnerUp, fitScore: fitScore - 15, fitReasons: runnerUp.keyBenefits.slice(0, 2) },
  };
}
