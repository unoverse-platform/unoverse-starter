import React from "react";
import styles from "../CardFinder.module.css";
import { EligibilityResult as EligibilityResultType, EligibilityStatus } from "../types";

interface EligibilityResultProps {
  result: EligibilityResultType;
  cardName: string;
}

const STATUS_CONFIG: Record<
  EligibilityStatus,
  {
    icon: React.ReactNode;
    title: string;
    className: string;
  }
> = {
  safe: {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    title: "Safe to apply",
    className: "statusSafe",
  },
  borderline: {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    title: "Borderline eligibility",
    className: "statusBorderline",
  },
  "not-advised": {
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    title: "Not advised at this time",
    className: "statusNotAdvised",
  },
};

export default function EligibilityResult({ result, cardName }: EligibilityResultProps) {
  const config = STATUS_CONFIG[result.status];

  return (
    <div className={styles.eligibilityResult}>
      <div className={`${styles.statusBanner} ${styles[config.className]}`}>
        <div className={styles.statusIcon}>{config.icon}</div>
        <div className={styles.statusContent}>
          <h3 className={styles.statusTitle}>{config.title}</h3>
          <p className={styles.statusCard}>for {cardName}</p>
        </div>
      </div>

      <div className={styles.resultSection}>
        <h4 className={styles.resultSectionTitle}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          Why?
        </h4>
        <ul className={styles.resultList}>
          {result.policyReasons.map((reason, index) => (
            <li key={index} className={styles.resultItem}>
              <span className={`${styles.resultBullet} ${styles[config.className]}`}>•</span>
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {result.improvementTips.length > 0 && (
        <div className={styles.resultSection}>
          <h4 className={styles.resultSectionTitle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            How to improve your chances
          </h4>
          <ul className={styles.resultList}>
            {result.improvementTips.map((tip, index) => (
              <li key={index} className={styles.resultItem}>
                <span className={styles.resultBullet}>→</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
