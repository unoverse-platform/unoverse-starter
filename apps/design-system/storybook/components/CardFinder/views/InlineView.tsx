import React from "react";
import styles from "../CardFinder.module.css";
import { WidgetPhase, CardRecommendation, CardFamily } from "../types";
import { DEFAULT_HERO_IMAGE } from "../defaults";

interface InlineViewProps {
  currentPhase: WidgetPhase;
  currentQuestion: number;
  totalQuestionsEligibility: number;
  totalQuestionsBestFit: number;
  eligibleTiers?: CardFamily[];
  recommendedCard?: CardRecommendation;
  heroImage?: string;
}

export default function InlineView({
  currentPhase,
  currentQuestion,
  totalQuestionsEligibility,
  totalQuestionsBestFit,
  eligibleTiers,
  recommendedCard,
  heroImage,
}: InlineViewProps) {
  const getContent = () => {
    if (currentPhase === "result" && recommendedCard) {
      return {
        title: "Card Finder",
        primary: recommendedCard.card.name,
        secondary: "Recommended for you",
        phase: "Complete",
        iconClass: styles.inlineIconComplete,
      };
    }

    if (currentPhase === "best-fit") {
      return {
        title: "Card Finder",
        primary: "Finding your perfect card",
        secondary: `Question ${currentQuestion + 1} of ${totalQuestionsBestFit}`,
        phase: "Preferences",
        iconClass: styles.inlineIconPhase2,
      };
    }

    if (currentPhase === "eligibility" && currentQuestion >= totalQuestionsEligibility) {
      return {
        title: "Card Finder",
        primary: `${eligibleTiers?.length || 0} card tiers available`,
        secondary: "Ready to find your match",
        phase: "Eligible",
        iconClass: styles.inlineIconComplete,
      };
    }

    return {
      title: "Card Finder",
      primary: "Check your eligibility",
      secondary: `Question ${currentQuestion + 1} of ${totalQuestionsEligibility}`,
      phase: "Eligibility",
      iconClass: "",
    };
  };

  const content = getContent();

  return (
    <div className={styles.inlineCard}>
      <div className={styles.inlineMain}>
        <div className={`${styles.inlineIcon} ${content.iconClass}`}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        </div>
        <div className={styles.inlineContent}>
          <div className={styles.inlineHeader}>
            <span className={styles.inlineTitle}>{content.title}</span>
            <span className={styles.inlinePhase}>{content.phase}</span>
          </div>
          <div className={styles.inlinePrimary}>{content.primary}</div>
          <div className={styles.inlineSecondary}>{content.secondary}</div>
        </div>
      </div>
      <div className={styles.inlineImage}>
        <img src={heroImage || DEFAULT_HERO_IMAGE} alt="Credit Card" />
      </div>
    </div>
  );
}
