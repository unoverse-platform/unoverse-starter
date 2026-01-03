// Credit Card Eligibility Widget - TypeScript Interfaces

export type PrimaryGoal = "cashback" | "travel" | "miles" | "premium";
export type AirlinePreference = "emirates" | "saudia" | "none";
export type TravelFrequency = "0-1" | "2-4" | "5-10" | "10+";
export type FeeTolerance = "low" | "medium" | "high";
export type IncomeRange = "<7000" | "7000-12000" | "12000-20000" | "20000+";
export type SalaryTransfer = "yes" | "no" | "unsure";
export type Residency = "saudi" | "non-saudi";
export type EligibilityStatus = "safe" | "borderline" | "not-advised";
export type CardFamily = "airline-premium" | "premium-travel" | "mid-tier" | "cashback";
export type WidgetPhase = "eligibility" | "best-fit" | "result";

export interface CreditCard {
  id: string;
  name: string;
  network: "VISA" | "Mastercard";
  tier: string;
  family: CardFamily;
  positioning: string;
  imageUrl: string;
  annualFee: number | null;
  annualFeeNotes?: string;
  keyBenefits: string[];
  uiTags: string[];
}

export interface QuestionOption<T> {
  value: T;
  label: string;
  description?: string;
  icon?: string;
}

export interface BestFitAnswers {
  primaryGoal?: PrimaryGoal;
  airlinePreference?: AirlinePreference;
  travelFrequency?: TravelFrequency;
  feeTolerance?: FeeTolerance;
}

export interface PolicySafetyAnswers {
  incomeRange?: IncomeRange;
  salaryTransfer?: SalaryTransfer;
  residency?: Residency;
}

export interface CardRecommendation {
  card: CreditCard;
  fitScore: number;
  fitReasons: string[];
}

export interface EligibilityResult {
  status: EligibilityStatus;
  policyReasons: string[];
  improvementTips: string[];
}

export interface CreditCardEligibilityState {
  // Phase tracking
  currentPhase: WidgetPhase;
  currentQuestion: number;

  // Phase 1: Eligibility answers
  eligibilityAnswers: PolicySafetyAnswers;

  // Phase 1 output: Eligible card tiers
  eligibleTiers?: CardFamily[];

  // Phase 2: Best Fit answers
  bestFitAnswers: BestFitAnswers;

  // Phase 2 output: Recommendations
  recommendedCard?: CardRecommendation;
  runnerUpCard?: CardRecommendation;
}

export interface CreditCardEligibilityWidgetProps {
  /** Display state for focus mode: 'inline' (compact card) or 'focused' (full widget) */
  displayState?: "inline" | "focused";

  /** Hero image URL */
  heroImage?: string;

  /** Current phase (from Zustand state) */
  currentPhase?: WidgetPhase;

  /** Current question index (from Zustand state) */
  currentQuestion?: number;

  /** Phase 1: Eligibility answers (from Zustand state) */
  eligibilityAnswers?: PolicySafetyAnswers;

  /** Phase 1 output: Eligible card tiers */
  eligibleTiers?: CardFamily[];

  /** Phase 2: Best Fit answers (from Zustand state) */
  bestFitAnswers?: BestFitAnswers;

  /** Phase 2 recommended card (from Zustand state) */
  recommendedCard?: CardRecommendation;

  /** Phase 2 runner-up card (from Zustand state) */
  runnerUpCard?: CardRecommendation;

  /** Function to update Zustand state (injected by withZustandData HOC) */
  updateData?: (updates: Record<string, unknown>) => void;

  /** Callback when user wants to apply */
  onApply?: (card: CreditCard) => void;
}
