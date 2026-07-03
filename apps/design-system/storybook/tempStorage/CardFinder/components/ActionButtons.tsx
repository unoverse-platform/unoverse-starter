import React from "react";
import styles from "../CardFinder.module.css";
import Button from "../../../atoms/Button/Button";

interface ActionButtonsProps {
  onBack?: () => void;
  onNext?: () => void;
  onSkip?: () => void;
  nextLabel?: string;
  backLabel?: string;
  showBack?: boolean;
  showSkip?: boolean;
  nextDisabled?: boolean;
}

export default function ActionButtons({
  onBack,
  onNext,
  onSkip,
  nextLabel = "Continue",
  backLabel = "Back",
  showBack = true,
  showSkip = false,
  nextDisabled = false,
}: ActionButtonsProps) {
  return (
    <div className={styles.actions}>
      <div className={styles.actionButtons}>
        <div className={styles.actionButtonsLeft}>
          {showBack && onBack && (
            <Button variant="outline" size="md" onClick={onBack}>
              {backLabel}
            </Button>
          )}
        </div>
        <div className={styles.actionButtonsRight}>
          {showSkip && onSkip && (
            <Button variant="outline" size="md" onClick={onSkip}>
              Skip
            </Button>
          )}
          {onNext && (
            <Button variant="primary" size="md" onClick={onNext} disabled={nextDisabled}>
              {nextLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
