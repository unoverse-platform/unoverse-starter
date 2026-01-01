import React from "react";
import styles from "../CardFinder.module.css";
import { CardRecommendation as CardRecommendationType } from "../types";

interface CardRecommendationProps {
  recommendation: CardRecommendationType;
  isRunnerUp?: boolean;
  onSelect?: () => void;
}

export default function CardRecommendation({ recommendation, isRunnerUp = false, onSelect }: CardRecommendationProps) {
  const { card, fitScore, fitReasons } = recommendation;

  return (
    <div
      className={`${styles.cardRecommendation} ${isRunnerUp ? styles.cardRecommendationRunnerUp : ""}`}
      onClick={onSelect}
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      {!isRunnerUp && (
        <div className={styles.recommendedBadge}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <span>Recommended for you</span>
        </div>
      )}

      {isRunnerUp && (
        <div className={styles.runnerUpBadge}>
          <span>Also consider</span>
        </div>
      )}

      <div className={styles.cardDisplay}>
        <div className={styles.cardImageWrapper}>
          <img
            src={card.imageUrl}
            alt={card.name}
            className={styles.cardImage}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://www.sab.com/content/dam/sabpws/personal/c/credit-cards/credit-cards-hero-936x400.jpg";
            }}
          />
        </div>

        <div className={styles.cardInfo}>
          <div className={styles.cardHeader}>
            <h4 className={styles.cardName}>{card.name}</h4>
            <div className={styles.cardNetwork}>
              <span className={styles.networkBadge}>{card.network}</span>
              <span className={styles.tierBadge}>{card.tier}</span>
            </div>
          </div>

          <p className={styles.cardPositioning}>{card.positioning}</p>

          <div className={styles.cardFee}>
            {card.annualFee === 0 ? (
              <span className={styles.feeHighlight}>Free for life</span>
            ) : card.annualFee ? (
              <span>
                Annual fee: <strong>{card.annualFee} SAR</strong>
              </span>
            ) : (
              <span className={styles.feeNote}>{card.annualFeeNotes}</span>
            )}
          </div>
        </div>
      </div>

      {!isRunnerUp && (
        <>
          <div className={styles.fitScore}>
            <div className={styles.fitScoreLabel}>Fit Score</div>
            <div className={styles.fitScoreValue}>
              <span className={styles.fitScoreNumber}>{fitScore}</span>
              <span className={styles.fitScoreMax}>/100</span>
            </div>
            <div className={styles.fitScoreBar}>
              <div className={styles.fitScoreBarFill} style={{ width: `${fitScore}%` }} />
            </div>
          </div>

          <div className={styles.fitReasons}>
            <h5 className={styles.fitReasonsTitle}>Why this card?</h5>
            <ul className={styles.fitReasonsList}>
              {fitReasons.map((reason, index) => (
                <li key={index} className={styles.fitReason}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.keyBenefits}>
            <h5 className={styles.keyBenefitsTitle}>Key Benefits</h5>
            <div className={styles.benefitTags}>
              {card.keyBenefits.slice(0, 3).map((benefit, index) => (
                <span key={index} className={styles.benefitTag}>
                  {benefit}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {isRunnerUp && (
        <div className={styles.runnerUpBenefits}>
          {card.keyBenefits.slice(0, 2).map((benefit, index) => (
            <span key={index} className={styles.runnerUpBenefit}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              {benefit}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
