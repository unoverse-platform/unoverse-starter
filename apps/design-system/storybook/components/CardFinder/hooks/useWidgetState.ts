import { useState, useEffect, useCallback } from "react";
import {
  WidgetPhase,
  BestFitAnswers,
  PolicySafetyAnswers,
  CardRecommendation,
  CardFamily,
  CreditCardEligibilityState,
} from "../types";
import { calculateEligibleTiers } from "../logic/eligibilityLogic";
import { calculateRecommendations } from "../logic/recommendationLogic";
import { getEffectiveBestFitQuestions } from "../logic/questionLogic";
import { ELIGIBILITY_QUESTIONS } from "../logic/constants";

/**
 * Props for the widget state hook.
 *
 * Following DESIGN_SYSTEM_STATE.md pattern:
 * - `updateData` is injected by withZustandData HOC in production
 * - When `updateData` exists, state comes from Zustand (props)
 * - When `updateData` is undefined (Storybook), use local fallback state
 *
 * State key in production: `${chatId}_${nodeId}`
 */
interface WidgetStateProps {
  // Zustand state (from props via withZustandData HOC)
  // These are the actual prop names that come from Zustand
  currentPhase?: WidgetPhase;
  currentQuestion?: number;
  eligibilityAnswers?: PolicySafetyAnswers;
  eligibleTiers?: CardFamily[];
  bestFitAnswers?: BestFitAnswers;
  recommendedCard?: CardRecommendation;
  runnerUpCard?: CardRecommendation;

  // Zustand update function (injected by withZustandData HOC)
  // When this exists, we're in production mode with shared state
  updateData?: (data: Partial<CreditCardEligibilityState>) => void;

  // Callbacks
  onRestart?: () => void;
}

export function useWidgetState(props: WidgetStateProps) {
  const {
    currentPhase: propPhase,
    currentQuestion: propQuestion,
    eligibilityAnswers: propEligibility,
    eligibleTiers: propEligibleTiers,
    bestFitAnswers: propBestFit,
    recommendedCard: propRecommended,
    runnerUpCard: propRunnerUp,
    updateData,
    onRestart,
  } = props;

  // Fallback state for Storybook (no Zustand available)
  // Initialize from props to support Storybook's initial state
  const [fallbackPhase, setFallbackPhase] = useState<WidgetPhase>(propPhase ?? "eligibility");
  const [fallbackQuestion, setFallbackQuestion] = useState(propQuestion ?? 0);
  const [fallbackEligibilityAnswers, setFallbackEligibilityAnswers] = useState<PolicySafetyAnswers>(
    propEligibility ?? {}
  );
  const [fallbackEligibleTiers, setFallbackEligibleTiers] = useState<CardFamily[] | undefined>(propEligibleTiers);
  const [fallbackBestFit, setFallbackBestFit] = useState<BestFitAnswers>(propBestFit ?? {});
  const [fallbackRecommended, setFallbackRecommended] = useState<CardRecommendation | undefined>(propRecommended);
  const [fallbackRunnerUp, setFallbackRunnerUp] = useState<CardRecommendation | undefined>(propRunnerUp);

  // Use Zustand state if available, otherwise fallback state
  // This pattern ensures state is shared between inline and focused views:
  // - When Zustand provides a value → use it (production with withZustandData HOC)
  // - When Zustand doesn't provide a value → use fallback (Storybook or initial render)
  // The fallback state persists across view switches, fixing the state isolation bug
  const currentPhase = propPhase ?? fallbackPhase;
  const currentQuestion = propQuestion ?? fallbackQuestion;
  const eligibilityAnswers = propEligibility ?? fallbackEligibilityAnswers;
  const eligibleTiers = propEligibleTiers ?? fallbackEligibleTiers;
  const bestFitAnswers = propBestFit ?? fallbackBestFit;
  const recommendedCard = propRecommended ?? fallbackRecommended;
  const runnerUpCard = propRunnerUp ?? fallbackRunnerUp;

  // State update wrappers
  const setCurrentPhase = useCallback(
    (phase: WidgetPhase) => {
      if (updateData) {
        updateData({ currentPhase: phase });
      } else {
        setFallbackPhase(phase);
      }
    },
    [updateData]
  );

  const setCurrentQuestion = useCallback(
    (q: number) => {
      if (updateData) {
        updateData({ currentQuestion: q });
      } else {
        setFallbackQuestion(q);
      }
    },
    [updateData]
  );

  const setEligibilityAnswers = useCallback(
    (answers: PolicySafetyAnswers) => {
      if (updateData) {
        updateData({ eligibilityAnswers: answers });
      } else {
        setFallbackEligibilityAnswers(answers);
      }
    },
    [updateData]
  );

  const setEligibleTiers = useCallback(
    (tiers: CardFamily[]) => {
      if (updateData) {
        updateData({ eligibleTiers: tiers });
      } else {
        setFallbackEligibleTiers(tiers);
      }
    },
    [updateData]
  );

  const setBestFitAnswers = useCallback(
    (answers: BestFitAnswers) => {
      if (updateData) {
        updateData({ bestFitAnswers: answers });
      } else {
        setFallbackBestFit(answers);
      }
    },
    [updateData]
  );

  const setRecommendedCard = useCallback(
    (card: CardRecommendation | undefined) => {
      if (updateData) {
        updateData({ recommendedCard: card });
      } else {
        setFallbackRecommended(card);
      }
    },
    [updateData]
  );

  const setRunnerUpCard = useCallback(
    (card: CardRecommendation | undefined) => {
      if (updateData) {
        updateData({ runnerUpCard: card });
      } else {
        setFallbackRunnerUp(card);
      }
    },
    [updateData]
  );

  // Initialize Zustand state on first render if not already set
  useEffect(() => {
    if (updateData && propPhase === undefined) {
      updateData({
        currentPhase: "eligibility",
        currentQuestion: 0,
        eligibilityAnswers: {},
        bestFitAnswers: {},
      });
    }
  }, [updateData, propPhase]);

  // Derived values
  const totalQuestionsEligibility = ELIGIBILITY_QUESTIONS.length;
  const effectiveBestFitQuestions = getEffectiveBestFitQuestions(eligibleTiers, bestFitAnswers);
  const totalQuestionsBestFit = effectiveBestFitQuestions.length;
  const isShowingEligibilitySummary = currentPhase === "eligibility" && currentQuestion >= totalQuestionsEligibility;
  const isShowingResult = currentPhase === "result";

  // Answer handlers
  const handleEligibilityAnswer = useCallback(
    (key: string, value: string) => {
      const newAnswers = { ...eligibilityAnswers, [key]: value };
      setEligibilityAnswers(newAnswers);
    },
    [eligibilityAnswers, setEligibilityAnswers]
  );

  const handleBestFitAnswer = useCallback(
    (key: string, value: string) => {
      const newAnswers = { ...bestFitAnswers, [key]: value };
      setBestFitAnswers(newAnswers);
    },
    [bestFitAnswers, setBestFitAnswers]
  );

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentPhase === "eligibility") {
      if (currentQuestion < totalQuestionsEligibility - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        // Calculate eligible tiers and show eligibility summary
        const tiers = calculateEligibleTiers(eligibilityAnswers);
        setEligibleTiers(tiers);
        setCurrentQuestion(totalQuestionsEligibility); // Show eligibility summary
      }
    } else if (currentPhase === "best-fit") {
      if (currentQuestion < totalQuestionsBestFit - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        // Calculate recommendations and show result
        const { recommended, runnerUp } = calculateRecommendations(bestFitAnswers, eligibleTiers);
        setRecommendedCard(recommended);
        setRunnerUpCard(runnerUp);
        setCurrentPhase("result");
        setCurrentQuestion(0);
      }
    }
  }, [
    currentPhase,
    currentQuestion,
    totalQuestionsEligibility,
    totalQuestionsBestFit,
    eligibilityAnswers,
    eligibleTiers,
    bestFitAnswers,
    setCurrentQuestion,
    setEligibleTiers,
    setRecommendedCard,
    setRunnerUpCard,
    setCurrentPhase,
  ]);

  const handleBack = useCallback(() => {
    if (currentPhase === "eligibility") {
      if (currentQuestion > 0) {
        setCurrentQuestion(currentQuestion - 1);
      }
    } else if (currentPhase === "best-fit") {
      if (currentQuestion > 0) {
        setCurrentQuestion(currentQuestion - 1);
      } else {
        // Go back to eligibility summary
        setCurrentPhase("eligibility");
        setCurrentQuestion(totalQuestionsEligibility);
      }
    }
  }, [currentPhase, currentQuestion, totalQuestionsEligibility, setCurrentQuestion, setCurrentPhase]);

  const handleProceedToBestFit = useCallback(() => {
    setCurrentPhase("best-fit");
    setCurrentQuestion(0);
  }, [setCurrentPhase, setCurrentQuestion]);

  const handleRestart = useCallback(() => {
    setCurrentPhase("eligibility");
    setCurrentQuestion(0);
    setEligibilityAnswers({});
    setBestFitAnswers({});
    setRecommendedCard(undefined);
    setRunnerUpCard(undefined);
    if (updateData) {
      updateData({ eligibleTiers: undefined });
    } else {
      setFallbackEligibleTiers(undefined);
    }
    onRestart?.();
  }, [
    setCurrentPhase,
    setCurrentQuestion,
    setEligibilityAnswers,
    setBestFitAnswers,
    setRecommendedCard,
    setRunnerUpCard,
    updateData,
    onRestart,
  ]);

  // Check if current question is answered
  const isCurrentQuestionAnswered = useCallback((): boolean => {
    if (currentPhase === "eligibility") {
      const questionKey = ELIGIBILITY_QUESTIONS[currentQuestion]?.key;
      return questionKey ? eligibilityAnswers[questionKey as keyof PolicySafetyAnswers] !== undefined : false;
    } else if (currentPhase === "best-fit") {
      const questionKey = effectiveBestFitQuestions[currentQuestion]?.key;
      return questionKey ? bestFitAnswers[questionKey as keyof BestFitAnswers] !== undefined : false;
    }
    return false;
  }, [currentPhase, currentQuestion, eligibilityAnswers, bestFitAnswers, effectiveBestFitQuestions]);

  return {
    // State
    currentPhase,
    currentQuestion,
    eligibilityAnswers,
    eligibleTiers,
    bestFitAnswers,
    recommendedCard,
    runnerUpCard,

    // Derived
    totalQuestionsEligibility,
    totalQuestionsBestFit,
    effectiveBestFitQuestions,
    isShowingEligibilitySummary,
    isShowingResult,

    // Handlers
    handleEligibilityAnswer,
    handleBestFitAnswer,
    handleNext,
    handleBack,
    handleProceedToBestFit,
    handleRestart,
    isCurrentQuestionAnswered,
  };
}
