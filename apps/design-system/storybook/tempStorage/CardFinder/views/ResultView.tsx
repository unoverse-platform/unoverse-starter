import React, { useState } from "react";
import styles from "../CardFinder.module.css";
import Button from "../../../atoms/Button/Button";
import { CardRecommendation } from "../types";

interface ResultViewProps {
  recommendedCard: CardRecommendation;
  runnerUpCard?: CardRecommendation;
  onApply: () => void;
}

export default function ResultView({ recommendedCard, runnerUpCard, onApply }: ResultViewProps) {
  const [selectedCard, setSelectedCard] = useState<"primary" | "secondary">("primary");
  const [isFlipping, setIsFlipping] = useState(false);

  const activeCard = selectedCard === "primary" ? recommendedCard : runnerUpCard || recommendedCard;
  const alternateCard = selectedCard === "primary" ? runnerUpCard : recommendedCard;
  const { card, fitScore, fitReasons } = activeCard;

  const handleSwapCard = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setSelectedCard(selectedCard === "primary" ? "secondary" : "primary");
      setIsFlipping(false);
    }, 150);
  };

  const handleApplyClick = () => {
    // Build object exactly like Card2 does
    const obj = {
      ...card,
      object_type: "service",
      title: card.name,
      description: card.positioning,
      image: card.imageUrl,
    };
    console.log("[CardFinder] Button clicked, dispatching gravity:action", obj.title);
    window.dispatchEvent(
      new CustomEvent("gravity:action", {
        detail: { type: "click", data: { object: obj }, componentId: "CardFinder" },
      })
    );
  };

  const matchPercentage = Math.min(Math.round(fitScore), 100);

  return (
    <div className={styles.resultViewPremium}>
      {/* Match Score Badge */}
      <div className={styles.matchScoreBadge}>
        <div className={styles.matchScoreRing}>
          <svg viewBox="0 0 36 36" className={styles.matchScoreCircle}>
            <path
              className={styles.matchScoreTrack}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={styles.matchScoreFill}
              strokeDasharray={`${matchPercentage}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <span className={styles.matchScoreValue}>{matchPercentage}%</span>
        </div>
        <span className={styles.matchScoreLabel}>Match</span>
      </div>

      {/* Main Content Grid */}
      <div className={styles.resultContentGrid}>
        {/* Left: Card Showcase + Alternate */}
        <div className={styles.cardShowcase}>
          <div className={`${styles.cardShowcaseInner} ${isFlipping ? styles.cardFlipping : ""}`}>
            {/* Floating Card with Glow */}
            <div className={styles.cardFloating}>
              <div className={styles.cardGlow} />
              <img
                src={card.imageUrl}
                alt={card.name}
                className={styles.cardShowcaseImg}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://www.sab.com/content/dam/sabpws/common/cards-images/visa-signature-472X296.png";
                }}
              />
            </div>

            {/* Network Badge */}
            <div className={styles.networkBadgeFloat}>
              {card.network === "VISA" ? (
                <svg viewBox="0 0 48 16" className={styles.networkLogo}>
                  <text x="0" y="13" fill="currentColor" fontSize="14" fontWeight="bold" fontStyle="italic">
                    VISA
                  </text>
                </svg>
              ) : (
                <svg viewBox="0 0 48 16" className={styles.networkLogo}>
                  <circle cx="14" cy="8" r="7" fill="#EB001B" opacity="0.9" />
                  <circle cx="26" cy="8" r="7" fill="#F79E1B" opacity="0.9" />
                </svg>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className={styles.quickStats}>
            <div className={styles.quickStat}>
              <span className={styles.quickStatValue}>
                {card.annualFee === 0 || card.annualFee === null ? "Free" : `${card.annualFee}`}
              </span>
              <span className={styles.quickStatLabel}>
                {card.annualFee === 0 || card.annualFee === null ? "for life" : "SAR/year"}
              </span>
            </div>
            <div className={styles.quickStatDivider} />
            <div className={styles.quickStat}>
              <span className={styles.quickStatValue}>{card.tier}</span>
              <span className={styles.quickStatLabel}>Card Tier</span>
            </div>
          </div>

          {/* Alternate Card - Moved up into left column */}
          {alternateCard && alternateCard.card.id !== activeCard.card.id && (
            <button className={styles.alternateCardInline} onClick={handleSwapCard}>
              <div className={styles.alternateCardPreviewInline}>
                <img src={alternateCard.card.imageUrl} alt="" className={styles.alternateCardImg} />
              </div>
              <div className={styles.alternateCardContentInline}>
                <span className={styles.alternateCardLabelInline}>Also a great match</span>
                <span className={styles.alternateCardNameInline}>{alternateCard.card.name}</span>
                <span className={styles.alternateCardScoreInline}>
                  {Math.min(Math.round(alternateCard.fitScore), 100)}% match
                </span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={styles.alternateCardArrowInline}
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          )}
        </div>

        {/* Right: Card Details */}
        <div className={styles.cardDetails}>
          {/* Header */}
          <div className={styles.cardDetailsHeader}>
            <div className={styles.cardTierPill}>{card.family.replace("-", " ")}</div>
            <h2 className={styles.cardNameLarge}>{card.name}</h2>
            <p className={styles.cardPositioning}>{card.positioning}</p>
          </div>

          {/* Tags */}
          <div className={styles.cardTagsRow}>
            {card.uiTags.slice(0, 5).map((tag, i) => (
              <span key={i} className={styles.cardTagPill}>
                {tag}
              </span>
            ))}
          </div>

          {/* Key Benefits */}
          <div className={styles.benefitsSection}>
            <h3 className={styles.benefitsSectionTitle}>Key Benefits</h3>
            <div className={styles.benefitsList}>
              {card.keyBenefits.slice(0, 4).map((benefit, i) => (
                <div key={i} className={styles.benefitItem} style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className={styles.benefitIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className={styles.benefitText}>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Why This Card */}
          {fitReasons && fitReasons.length > 0 && (
            <div className={styles.whyThisCard}>
              <h4 className={styles.whyTitle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                Why this card for you
              </h4>
              <ul className={styles.whyList}>
                {fitReasons.slice(0, 2).map((reason, i) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA */}
          <div className={styles.ctaSection}>
            <Button variant="primary" size="lg" onClick={handleApplyClick} className={styles.applyButtonPremium}>
              <span>Apply for this card</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Button>
            <p className={styles.ctaNote}>{card.annualFeeNotes || "Quick online application • Instant decision"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
