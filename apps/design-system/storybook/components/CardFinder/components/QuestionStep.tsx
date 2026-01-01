import React from "react";
import styles from "../CardFinder.module.css";
import { QuestionOption } from "../types";

interface QuestionStepProps<T extends string> {
  question: string;
  subtitle?: string;
  options: QuestionOption<T>[];
  selectedValue?: T;
  onSelect: (value: T) => void;
}

export default function QuestionStep<T extends string>({
  question,
  subtitle,
  options,
  selectedValue,
  onSelect,
}: QuestionStepProps<T>) {
  return (
    <div className={styles.questionStep}>
      <div className={styles.questionHeader}>
        <h3 className={styles.questionTitle}>{question}</h3>
        {subtitle && <p className={styles.questionSubtitle}>{subtitle}</p>}
      </div>

      <div className={styles.optionsGrid}>
        {options.map((option) => (
          <button
            key={option.value}
            className={`${styles.optionCard} ${selectedValue === option.value ? styles.optionCardSelected : ""}`}
            onClick={() => onSelect(option.value)}
            type="button"
          >
            {option.icon && <span className={styles.optionIcon}>{option.icon}</span>}
            <div className={styles.optionContent}>
              <span className={styles.optionLabel}>{option.label}</span>
              {option.description && <span className={styles.optionDescription}>{option.description}</span>}
            </div>
            <div className={styles.optionCheck}>
              {selectedValue === option.value && (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
