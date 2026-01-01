import React from "react";
import styles from "./CardFinder.module.css";
import KenBurnsImage from "../../atoms/Image/KenBurnsImage";
import QuestionStep from "./components/QuestionStep";
import ProgressIndicator from "./components/ProgressIndicator";
import ActionButtons from "./components/ActionButtons";

import { CreditCardEligibilityWidgetProps, QuestionOption, PolicySafetyAnswers, BestFitAnswers } from "./types";
import {
  AIRLINE_PREFERENCE_OPTIONS,
  TRAVEL_FREQUENCY_OPTIONS,
  FEE_TOLERANCE_OPTIONS,
  INCOME_RANGE_OPTIONS,
  SALARY_TRANSFER_OPTIONS,
  RESIDENCY_OPTIONS,
  DEFAULT_HERO_IMAGE,
} from "./defaults";

import { useWidgetState } from "./hooks/useWidgetState";
import { ELIGIBILITY_QUESTIONS } from "./logic/constants";
import { getFilteredPrimaryGoalOptions } from "./logic/questionLogic";
import { InlineView, EligibilitySummary, ResultView } from "./views";

export default function CreditCardEligibilityWidget(props: CreditCardEligibilityWidgetProps) {
  const {
    displayState = "focused",
    heroImage,
    currentPhase: propPhase,
    currentQuestion: propQuestion,
    eligibilityAnswers: propEligibility,
    eligibleTiers: propEligibleTiers,
    bestFitAnswers: propBestFit,
    recommendedCard: propRecommended,
    runnerUpCard: propRunnerUp,
    updateData,
    onApply,
    onRestart,
  } = props;

  const {
    currentPhase,
    currentQuestion,
    eligibilityAnswers,
    eligibleTiers,
    bestFitAnswers,
    recommendedCard,
    runnerUpCard,
    totalQuestionsEligibility,
    totalQuestionsBestFit,
    effectiveBestFitQuestions,
    isShowingEligibilitySummary,
    isShowingResult,
    handleEligibilityAnswer,
    handleBestFitAnswer,
    handleNext,
    handleBack,
    handleProceedToBestFit,
    handleRestart,
    isCurrentQuestionAnswered,
  } = useWidgetState({
    currentPhase: propPhase,
    currentQuestion: propQuestion,
    eligibilityAnswers: propEligibility,
    eligibleTiers: propEligibleTiers,
    bestFitAnswers: propBestFit,
    recommendedCard: propRecommended,
    runnerUpCard: propRunnerUp,
    updateData,
    onRestart,
  });

  const handleApply = () => {
    if (recommendedCard) {
      onApply?.(recommendedCard.card);
    }
  };

  // Render current question
  const renderQuestion = () => {
    if (currentPhase === "eligibility") {
      const q = ELIGIBILITY_QUESTIONS[currentQuestion];
      if (!q) return null;

      const optionsMap: Record<string, QuestionOption<string>[]> = {
        incomeRange: INCOME_RANGE_OPTIONS,
        salaryTransfer: SALARY_TRANSFER_OPTIONS,
        residency: RESIDENCY_OPTIONS,
      };

      return (
        <QuestionStep
          question={q.question}
          subtitle={q.subtitle}
          options={optionsMap[q.key] || []}
          selectedValue={eligibilityAnswers[q.key as keyof PolicySafetyAnswers]}
          onSelect={(value) => handleEligibilityAnswer(q.key, value)}
        />
      );
    } else if (currentPhase === "best-fit") {
      const q = effectiveBestFitQuestions[currentQuestion];
      if (!q) return null;

      const optionsMap: Record<string, QuestionOption<string>[]> = {
        primaryGoal: getFilteredPrimaryGoalOptions(eligibleTiers),
        airlinePreference: AIRLINE_PREFERENCE_OPTIONS,
        travelFrequency: TRAVEL_FREQUENCY_OPTIONS,
        feeTolerance: FEE_TOLERANCE_OPTIONS,
      };

      return (
        <QuestionStep
          question={q.question}
          subtitle={q.subtitle}
          options={optionsMap[q.key] || []}
          selectedValue={bestFitAnswers[q.key as keyof BestFitAnswers]}
          onSelect={(value) => handleBestFitAnswer(q.key, value)}
        />
      );
    }
    return null;
  };

  // INLINE VIEW
  if (displayState === "inline") {
    return (
      <InlineView
        currentPhase={currentPhase}
        currentQuestion={currentQuestion}
        totalQuestionsEligibility={totalQuestionsEligibility}
        totalQuestionsBestFit={totalQuestionsBestFit}
        eligibleTiers={eligibleTiers}
        recommendedCard={recommendedCard}
        heroImage={heroImage}
      />
    );
  }

  // FOCUSED VIEW
  return (
    <div className={styles.widget}>
      <div className={isShowingResult ? styles.contentFullWidth : styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <div className={styles.headerText}>
              <h2 className={styles.headerTitle}>
                {isShowingResult
                  ? "Your Perfect Card"
                  : isShowingEligibilitySummary
                  ? "You're Eligible!"
                  : currentPhase === "best-fit"
                  ? "Find Your Match"
                  : "Quick Eligibility Check"}
              </h2>
              <p className={styles.headerSubtitle}>
                {isShowingResult
                  ? "Based on your profile and preferences"
                  : isShowingEligibilitySummary
                  ? "Let's find your perfect card"
                  : currentPhase === "best-fit"
                  ? "Tell us what matters to you"
                  : "3 quick questions"}
              </p>
            </div>
          </div>
          {/* Close button in header for result view */}
          {isShowingResult && (
            <button className={styles.closeButton} aria-label="Close" onClick={handleRestart}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Progress Indicator */}
        {!isShowingResult && (
          <ProgressIndicator
            currentPhase={currentPhase}
            currentQuestion={isShowingEligibilitySummary ? totalQuestionsEligibility - 1 : currentQuestion}
            totalQuestionsPhase1={totalQuestionsEligibility}
            totalQuestionsPhase2={totalQuestionsBestFit}
          />
        )}

        {/* Content */}
        {isShowingResult && recommendedCard ? (
          <ResultView
            recommendedCard={recommendedCard}
            runnerUpCard={runnerUpCard}
            onApply={handleApply}
            onRestart={handleRestart}
          />
        ) : isShowingEligibilitySummary ? (
          <EligibilitySummary eligibleTiers={eligibleTiers || []} />
        ) : (
          <div className={styles.stepContent}>{renderQuestion()}</div>
        )}

        {/* Actions */}
        {!isShowingResult && (
          <ActionButtons
            onBack={currentQuestion > 0 || currentPhase === "best-fit" ? handleBack : undefined}
            onNext={isShowingEligibilitySummary ? handleProceedToBestFit : handleNext}
            nextLabel={isShowingEligibilitySummary ? "Find My Card" : "Continue"}
            showBack={currentQuestion > 0 || currentPhase === "best-fit"}
            nextDisabled={!isShowingEligibilitySummary && !isCurrentQuestionAnswered()}
          />
        )}
      </div>

      {/* Hero Image - hidden on result view */}
      {!isShowingResult && (
        <div className={styles.imageContainer}>
          <KenBurnsImage src={heroImage || DEFAULT_HERO_IMAGE} alt="Credit Card" overlay={true} />
        </div>
      )}
    </div>
  );
}
