import React from "react";
import PrintPage from "../../../../atoms/print/PrintPage/PrintPage";
import NewsStory from "../../../../atoms/print/NewsStory/NewsStory";
import styles from "./NewspaperPage.module.css";
import type {
  NewspaperPageProps,
  NewspaperInput,
  Masthead,
  Article,
  ShortNote,
  WeatherBox,
  ClassifiedAd,
  Horoscope,
  BestsellerList,
  PullQuote,
} from "./types";
import type { LayoutSlot, PageLayout } from "./layouts";
import { FRONT_LAYOUT, BACK_LAYOUT } from "./layouts";
import { defaultNewspaperContent, assembleNewspaper, GENERIC_COMPONENTS } from "./defaults";

/* ─────────────────────────────────────────────
 * MASTHEAD
 * ───────────────────────────────────────────── */
const DEFAULT_MASTHEAD: Masthead = {
  paperName: "THE NAPA VALLEY REGISTER",
  tagline: "Serving Wine Country Since 1952",
  date: "Sunday, October 13, 2024",
  price: "$2.50",
  edition: "Morning Edition",
};

function MastheadBlock({ data }: { data: Masthead }) {
  return (
    <header className={styles.masthead}>
      <div className={styles.mastheadTopRule}>
        <span className={styles.mastheadRuleLine} />
        <span className={styles.mastheadRuleLine} />
      </div>
      <div className={styles.mastheadCenter}>
        <div className={styles.mastheadMeta}>
          <span>{data.edition ?? "Morning Edition"}</span>
          <span>{data.date}</span>
          <span>{data.price}</span>
        </div>
        <h1 className={styles.paperName}>{data.paperName}</h1>
        <p className={styles.tagline}>— {data.tagline} —</p>
      </div>
      <div className={styles.mastheadBottomRule}>
        <span className={styles.mastheadRuleLine} />
        <span className={styles.mastheadRuleThick} />
        <span className={styles.mastheadRuleLine} />
      </div>
    </header>
  );
}

/* ─────────────────────────────────────────────
 * BREAKING BANNER
 * ───────────────────────────────────────────── */
function BreakingBannerBlock({ data }: { data: NonNullable<NewspaperInput["breakingBanner"]> }) {
  return (
    <div className={styles.breakingBanner}>
      {data.label && <span className={styles.breakingLabel}>{data.label}</span>}
      <span className={styles.breakingHeadline}>{data.headline}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * ARTICLE BLOCK — delegates to NewsStory atom
 * Columns come from the layout slot, not the article.
 * ───────────────────────────────────────────── */
function ArticleBlock({
  article,
  columns = 1,
  layoutHint,
}: {
  article: Article;
  columns?: number;
  layoutHint?: "hero" | "sidebar" | "bottom" | "image-left";
}) {
  return (
    <NewsStory
      variant="standard"
      columns={Math.min(columns, 3) as 1 | 2 | 3}
      label={article.label}
      headline={article.headline}
      subheadline={article.subheadline}
      byline={article.byline}
      body={article.body}
      hasPhoto={article.hasPhoto}
      photoUrl={article.photoUrl}
      photoCaption={article.photoCaption}
      photoAspect={article.photoAspect}
      layoutHint={layoutHint}
    />
  );
}

/* ─────────────────────────────────────────────
 * SHORT NOTE — delegates to NewsStory featured variant
 * ───────────────────────────────────────────── */
function ShortNoteBlock({ article, variant = "dark" }: { article: Article; variant?: "dark" | "light" }) {
  return (
    <NewsStory
      variant="featured"
      theme={variant}
      label={article.label}
      headline={article.headline}
      body={article.body}
    />
  );
}

/* ─────────────────────────────────────────────
 * PHOTO BLOCK
 * ───────────────────────────────────────────── */
function PhotoBlockEl({ slot }: { slot: LayoutSlot }) {
  const aspectRatio =
    slot.photoAspect === "portrait"
      ? "3/4"
      : slot.photoAspect === "square"
        ? "1/1"
        : slot.photoAspect === "wide"
          ? "3/1"
          : "16/9";

  return (
    <div className={styles.photoBlock}>
      {slot.photoUrl ? (
        <img src={slot.photoUrl} alt={slot.photoCaption || ""} className={styles.photoImage} style={{ aspectRatio }} />
      ) : (
        <div className={styles.photoPlaceholder} style={{ aspectRatio }} />
      )}
      {slot.photoCaption && <p className={styles.photoCaption}>{slot.photoCaption}</p>}
      {slot.photoByline && <p className={styles.photoCreditLine}>{slot.photoByline}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────
 * PULL QUOTE
 * ───────────────────────────────────────────── */
function PullQuoteBlock({ data }: { data: PullQuote }) {
  return (
    <aside className={styles.pullQuote}>
      <div className={styles.pullQuoteRule} />
      <blockquote className={styles.pullQuoteText}>"{data.quote}"</blockquote>
      <p className={styles.pullQuoteAttribution}>— {data.attribution}</p>
      <div className={styles.pullQuoteRule} />
    </aside>
  );
}

/* ─────────────────────────────────────────────
 * WEATHER BOX
 * ───────────────────────────────────────────── */
function WeatherBoxBlock({ data }: { data: WeatherBox }) {
  return (
    <div className={styles.weatherBox}>
      <div className={styles.weatherHeader}>WEATHER — {data.region.toUpperCase()}</div>
      <div className={styles.weatherBody}>
        <div className={styles.weatherMain}>
          <span className={styles.weatherIcon}>☀</span>
          <span className={styles.weatherDesc}>{data.description}</span>
        </div>
        <div className={styles.weatherTemps}>
          <span>
            High: <strong>{data.high}</strong>
          </span>
          <span>
            Low: <strong>{data.low}</strong>
          </span>
        </div>
      </div>
      {data.forecast && data.forecast.length > 0 && (
        <div className={styles.weatherForecast}>
          {data.forecast.map((f) => (
            <div key={f.day} className={styles.weatherForecastDay}>
              <span className={styles.weatherForecastLabel}>{f.day}</span>
              <span className={styles.weatherForecastIcon}>{f.icon}</span>
              <span className={styles.weatherForecastTemps}>
                {f.high} / {f.low}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
 * CLASSIFIEDS
 * ───────────────────────────────────────────── */
function ClassifiedsBlock({ ads }: { ads: ClassifiedAd[] }) {
  return (
    <div className={styles.classifieds}>
      <div className={styles.classifiedsHeader}>CLASSIFIEDS</div>
      <div className={styles.classifiedsGrid}>
        {ads.map((ad) => (
          <div key={ad.id} className={styles.classifiedAd}>
            {ad.category && <span className={styles.classifiedCat}>{ad.category} — </span>}
            {ad.text}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * HOROSCOPES
 * ───────────────────────────────────────────── */
function HoroscopesBlock({ signs }: { signs: Horoscope[] }) {
  return (
    <div className={styles.horoscopes}>
      <div className={styles.sectionHeader}>HOROSCOPES</div>
      <div className={styles.horoscopeGrid}>
        {signs.map((h) => (
          <div key={h.sign} className={styles.horoscopeItem}>
            <div className={styles.horoscopeSignRow}>
              <span className={styles.horoscopeSign}>{h.sign.toUpperCase()}</span>
              <span className={styles.horoscopeDates}>{h.dates}</span>
            </div>
            <p className={styles.horoscopeText}>{h.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * BESTSELLER LIST
 * ───────────────────────────────────────────── */
function BestsellerBlock({ data }: { data: BestsellerList }) {
  return (
    <div className={styles.bestseller}>
      <div className={styles.sectionHeader}>BESTSELLERS — {data.category.toUpperCase()}</div>
      <ol className={styles.bestsellerList}>
        {data.books.map((b) => (
          <li key={b.rank} className={styles.bestsellerItem}>
            <span className={styles.bestsellerRank}>{b.rank}.</span>{" "}
            <span className={styles.bestsellerTitle}>{b.title}</span>{" "}
            <span className={styles.bestsellerAuthor}>— {b.author}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * SLOT RENDERER — maps layout slot → component
 * ───────────────────────────────────────────── */
function renderSlotContent(slot: LayoutSlot, content: NewspaperInput) {
  switch (slot.render) {
    case "article": {
      const article = content.articles.find((a) => a.id === slot.articleId);
      if (!article) return null;
      return <ArticleBlock article={article} columns={slot.columns} layoutHint={slot.layoutHint} />;
    }
    case "shortNote": {
      const note = slot.componentKey ? content[slot.componentKey] : undefined;
      if (!note) return null;
      return (
        <ShortNoteBlock
          article={{ id: note.id, type: "secondary", headline: note.headline, body: note.body, label: note.label }}
          variant={slot.variant}
        />
      );
    }
    case "photo":
      return <PhotoBlockEl slot={slot} />;
    case "weather":
      return content.sidebar?.weather ? <WeatherBoxBlock data={content.sidebar.weather} /> : null;
    case "classifieds":
      return content.classifieds ? <ClassifiedsBlock ads={content.classifieds} /> : null;
    case "horoscopes":
      return content.sidebar?.horoscopes ? <HoroscopesBlock signs={content.sidebar.horoscopes} /> : null;
    case "bestsellers":
      return content.sidebar?.bestsellers ? <BestsellerBlock data={content.sidebar.bestsellers} /> : null;
    case "pullQuote":
      return content.sidebar?.pullQuote ? <PullQuoteBlock data={content.sidebar.pullQuote} /> : null;
    default:
      return null;
  }
}

function renderSlot(slot: LayoutSlot, idx: number, content: NewspaperInput) {
  const startsAtCol1 = slot.gridColumn === "1" || slot.gridColumn.startsWith("1 ");
  const isRow1 = slot.gridRow === "1";
  return (
    <div
      key={slot.name}
      style={{
        gridRow: slot.gridRow,
        gridColumn: slot.gridColumn,
        height: "100%",
        ...(!startsAtCol1 ? { borderLeft: "1pt solid #aaa" } : {}),
        ...(!isRow1 ? { borderTop: "0.5pt solid #ccc" } : {}),
      }}
    >
      {renderSlotContent(slot, content)}
    </div>
  );
}

/* ─────────────────────────────────────────────
 * SINGLE PAGE RENDERER
 * ───────────────────────────────────────────── */
function NewspaperPageSingle({ layout, content }: { layout: PageLayout; content: NewspaperInput }) {
  const masthead: Masthead = { ...DEFAULT_MASTHEAD, ...content.masthead };
  return (
    <PrintPage size="tabloid">
      <div className={styles.page}>
        {layout.showMasthead && <MastheadBlock data={masthead} />}
        {layout.showBreakingBanner && content.breakingBanner && <BreakingBannerBlock data={content.breakingBanner} />}
        <div className={styles.columnRule} />
        <div className={styles.contentGrid} style={{ gridTemplateRows: layout.gridRows }}>
          {layout.slots.map((slot, i) => renderSlot(slot, i, content))}
        </div>
      </div>
    </PrintPage>
  );
}

/* ─────────────────────────────────────────────
 * MAIN COMPONENT — one call = front + back page
 * ───────────────────────────────────────────── */
export default function NewspaperPage({
  mainArticles, // Prompt 1: articles 1, 7
  obituary, // Prompt 2: article 8
  featureArticles, // Prompt 3: articles 2, 4, 6
  newsArticles, // Prompt 4: articles 3, 5
  components, // Hardcoded or generated
  images, // Array of 4 image URLs: [article2_photo, article7_photo_left, article7_photo_right, article8_photo]
}: NewspaperPageProps) {
  let content: NewspaperInput;

  // Merge all 4 article arrays if provided
  if (mainArticles || obituary || featureArticles || newsArticles) {
    const allArticles = [
      ...(mainArticles?.articles || []),
      ...(obituary?.articles || []),
      ...(featureArticles?.articles || []),
      ...(newsArticles?.articles || []),
    ];

    // Articles 1 and 7 never render inline photos — their images
    // are handled by standalone photo layout slots on the page
    allArticles.forEach((article) => {
      if (article.id === "1" || article.id === "7") {
        article.hasPhoto = false;
      }
    });

    // Map images to articles if provided
    // images[0] -> article 2, images[1] -> back page photo slots, images[2] -> back page photo slots, images[3] -> article 8
    if (images && images.length >= 4) {
      allArticles.forEach((article) => {
        if (article.id === "2" && images[0]) {
          article.photoUrl = images[0];
        } else if (article.id === "8" && images[3]) {
          article.photoUrl = images[3];
        }
      });
    }

    // Merge provided components with generic defaults
    // This allows LLM to generate partial components (e.g., just classifieds/horoscopes/bestsellers)
    const finalComponents = {
      ...GENERIC_COMPONENTS,
      ...(components || {}),
    };

    content = assembleNewspaper({ articles: allArticles }, finalComponents);
  } else {
    // Fallback to default content for Storybook preview
    content = defaultNewspaperContent;
  }

  React.useEffect(() => {
    const fontId = "gravity-newspaper-fonts";
    if (!document.getElementById(fontId)) {
      const link = document.createElement("link");
      link.id = fontId;
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=Special+Elite&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  // Inject image URLs and captions into back page photo slots
  // Photo captions come from articles 1 and 7 (main articles LLM output)
  // images[0] -> article 2 (handled above), images[1] -> left photo, images[2] -> right photo, images[3] -> article 8 (handled above)
  const article1 = content.articles.find((a) => a.id === "1");
  const article7 = content.articles.find((a) => a.id === "7");

  const frontLayout = FRONT_LAYOUT;
  const backLayout = {
    ...BACK_LAYOUT,
    slots: BACK_LAYOUT.slots.map((slot) => {
      if (slot.name === "back_r1_photo_left") {
        return {
          ...slot,
          ...(images && images[1] ? { photoUrl: images[1] } : {}),
          ...(article1?.photoCaption ? { photoCaption: article1.photoCaption } : {}),
        };
      }
      if (slot.name === "back_r1_photo_right") {
        return {
          ...slot,
          ...(images && images[2] ? { photoUrl: images[2] } : {}),
          ...(article7?.photoCaption ? { photoCaption: article7.photoCaption } : {}),
        };
      }
      return slot;
    }),
  };

  return (
    <>
      <NewspaperPageSingle layout={frontLayout} content={content} />
      <NewspaperPageSingle layout={backLayout} content={content} />
    </>
  );
}
