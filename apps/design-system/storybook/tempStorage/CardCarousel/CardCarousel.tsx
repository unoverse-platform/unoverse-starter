import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./CardCarousel.module.css";
import Button from "../../atoms/Button/Button";
import { CardCarouselDefaults } from "./defaults";

interface CardItem {
  object_type?: string;
  id?: string;
  title?: string;
  description?: string;
  urlLink?: string;
  image?: string | null;
  similarity_score?: number;
  metadata?: {
    images?: string[];
    callToAction?: string;
    shortDescription?: string;
    [key: string]: any;
  };
}

interface CardCarouselProps {
  items?: CardItem[];
  onCardClick?: (item: CardItem) => void;
}

export default function CardCarousel(props: CardCarouselProps) {
  const { items = [], onCardClick } = props;
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleCardClick = (item: CardItem) => {
    console.log("[CardCarousel] Card clicked, dispatching gravity:action", item.title);
    window.dispatchEvent(
      new CustomEvent("gravity:action", {
        detail: { type: "click", data: { object: item }, componentId: "CardCarousel" },
      })
    );
    onCardClick?.(item);
  };

  const getImage = (item: CardItem): string | undefined => {
    return item.image || item.metadata?.images?.[0] || undefined;
  };

  const getCallToAction = (item: CardItem): string => {
    return item.metadata?.action || item.metadata?.callToAction || "Learn More";
  };

  // Show default sample data when no items provided (for workflow preview)
  const displayItems = items && items.length > 0 ? items : CardCarouselDefaults.items;

  const isSingleItem = displayItems.length === 1;

  return (
    <div className={styles.container}>
      <div className={styles.carouselWrapper}>
        {!isSingleItem && (
          <button
            className={`${styles.navButton} ${styles.navLeft}`}
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <div className={styles.carousel} ref={scrollRef}>
          {displayItems.map((item, index) => {
            const image = getImage(item);
            const cta = getCallToAction(item);
            const isSingle = displayItems.length === 1;

            return (
              <div key={item.id || index} className={`${styles.card} ${isSingle ? styles.singleCard : ""}`}>
                {image && (
                  <div className={styles.imageContainer}>
                    <img src={image} alt={item.title} className={styles.image} />
                  </div>
                )}
                <div className={styles.content}>
                  {/* Badge removed per design request */}
                  <h3 className={styles.title}>{item.title}</h3>
                  <p className={styles.description}>{item.metadata?.shortDescription || item.description}</p>
                  {cta && (
                    <Button variant="outline" size="sm" onClick={() => handleCardClick(item)}>
                      {cta}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!isSingleItem && (
          <button
            className={`${styles.navButton} ${styles.navRight}`}
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
}
