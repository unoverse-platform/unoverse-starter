import React from "react";
import styles from "../CardFinder.module.css";
import { CardFamily } from "../types";
import { TIER_LABELS, TIER_ORDER } from "../logic/constants";

interface EligibilitySummaryProps {
  eligibleTiers: CardFamily[];
}

export default function EligibilitySummary({ eligibleTiers }: EligibilitySummaryProps) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.eligibilitySummary}>
        <div className={styles.summaryHeader}>
          <div className={styles.summaryIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3 className={styles.summaryTitle}>Great news!</h3>
          <p className={styles.summarySubtitle}>
            Based on your profile, you qualify for {eligibleTiers.length} card{" "}
            {eligibleTiers.length === 1 ? "tier" : "tiers"}
          </p>
        </div>

        <div className={styles.tiersList}>
          {TIER_ORDER.map((tier) => {
            const isEligible = eligibleTiers.includes(tier);
            return (
              <div
                key={tier}
                className={`${styles.tierItem} ${isEligible ? styles.tierItemEligible : styles.tierItemIneligible}`}
              >
                <span className={styles.tierCheck}>
                  {isEligible ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                </span>
                <span className={styles.tierLabel}>{TIER_LABELS[tier]}</span>
              </div>
            );
          })}
        </div>

        <p className={styles.summaryNote}>Now let's find the perfect card based on your preferences</p>
      </div>
    </div>
  );
}
