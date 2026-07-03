import React from "react";
import styles from "../CardFinder.module.css";
import { WidgetPhase } from "../types";

interface ProgressIndicatorProps {
  currentPhase: WidgetPhase;
  currentQuestion: number;
  totalQuestionsPhase1: number;
  totalQuestionsPhase2: number;
}

export default function ProgressIndicator({
  currentPhase,
  currentQuestion,
  totalQuestionsPhase1,
  totalQuestionsPhase2,
}: ProgressIndicatorProps) {
  const phases = [
    { id: "eligibility", label: "Eligibility", questions: totalQuestionsPhase1 },
    { id: "best-fit", label: "Preferences", questions: totalQuestionsPhase2 },
    { id: "result", label: "Your Card", questions: 0 },
  ];

  const currentPhaseIndex = phases.findIndex((p) => p.id === currentPhase);

  return (
    <div className={styles.progressIndicator}>
      <div className={styles.progressPhases}>
        {phases.map((phase, index) => {
          const isActive = phase.id === currentPhase;
          const isCompleted = index < currentPhaseIndex;
          const isPending = index > currentPhaseIndex;

          return (
            <React.Fragment key={phase.id}>
              <div className={styles.progressPhase}>
                <div
                  className={`${styles.progressCircle} ${isActive ? styles.progressCircleActive : ""} ${
                    isCompleted ? styles.progressCircleCompleted : ""
                  } ${isPending ? styles.progressCirclePending : ""}`}
                >
                  {isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className={`${styles.progressLabel} ${isActive ? styles.progressLabelActive : ""}`}>
                  {phase.label}
                </span>
              </div>
              {index < phases.length - 1 && (
                <div
                  className={`${styles.progressConnector} ${isCompleted ? styles.progressConnectorCompleted : ""}`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {currentPhase !== "result" && (
        <div className={styles.progressQuestions}>
          <span className={styles.progressQuestionText}>
            Question {currentQuestion + 1} of{" "}
            {currentPhase === "eligibility" ? totalQuestionsPhase1 : totalQuestionsPhase2}
          </span>
          <div className={styles.progressBar}>
            <div
              className={styles.progressBarFill}
              style={{
                width: `${
                  ((currentQuestion + 1) /
                    (currentPhase === "eligibility" ? totalQuestionsPhase1 : totalQuestionsPhase2)) *
                  100
                }%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
