/* ─────────────────────────────────────────────
 * CONTENT TYPES — pure data, no layout concerns
 * ───────────────────────────────────────────── */

export interface Masthead {
  paperName: string;
  tagline: string;
  date: string;
  price: string;
  edition?: string;
}

export interface BreakingBanner {
  label?: string;
  headline: string;
}

/** An article is pure content. No columns, no grid, no page assignment. */
export interface Article {
  id: string;
  type: "main" | "secondary" | "continuation" | "red_herring" | "cameo" | "flavor" | "hidden_clue" | "obituary";
  headline: string;
  subheadline?: string;
  byline?: string;
  body: string;
  label?: string;
  hasPhoto?: boolean;
  photoUrl?: string;
  photoCaption?: string;
  photoAspect?: "landscape" | "portrait" | "square";
}

export interface WeatherBox {
  high: string;
  low: string;
  description: string;
  region: string;
  forecast?: { day: string; high: string; low: string; icon: string }[];
}

export interface Horoscope {
  sign: string;
  dates: string;
  text: string;
}

export interface BestsellerEntry {
  rank: number;
  title: string;
  author: string;
}

export interface BestsellerList {
  category: string;
  books: BestsellerEntry[];
}

export interface PullQuote {
  quote: string;
  attribution: string;
}

export interface ClassifiedAd {
  id: string;
  category?: string;
  text: string;
}

export interface SidebarContent {
  weather?: WeatherBox;
  horoscopes?: Horoscope[];
  bestsellers?: BestsellerList;
  pullQuote?: PullQuote;
}

/* ─────────────────────────────────────────────
 * SHORT NOTE — sheriff statement, editor's note, etc.
 * These live in the Components JSON, not Articles.
 * ───────────────────────────────────────────── */

export interface ShortNote {
  id: string;
  label: string;
  headline: string;
  body: string;
}

/* ─────────────────────────────────────────────
 * LLM JSON PAYLOADS — two files generated per game
 *
 * Articles JSON:  IDs 1–8 (sequential reporter stories)
 * Components JSON: masthead, banner, sheriff statement,
 *                  editor's note, horoscopes, bestsellers,
 *                  classifieds
 * Hardcoded:      weather, Posie
 * ───────────────────────────────────────────── */

export interface ArticlesPayload {
  articles: Article[];
}

export interface ComponentsPayload {
  masthead: Masthead;
  breakingBanner: BreakingBanner;
  sheriffStatement: ShortNote;
  editorsNote: ShortNote;
  horoscopes: Horoscope[];
  bestsellers: BestsellerList;
  classifieds: ClassifiedAd[];
}

/* ─────────────────────────────────────────────
 * TOP-LEVEL INPUT — assembled from payloads + hardcoded
 * ───────────────────────────────────────────── */

export interface NewspaperInput {
  masthead?: Partial<Masthead>;
  breakingBanner?: BreakingBanner;
  articles: Article[];
  sheriffStatement?: ShortNote;
  editorsNote?: ShortNote;
  sidebar?: SidebarContent;
  classifieds?: ClassifiedAd[];
}

export interface NewspaperPageProps {
  mainArticles?: ArticlesPayload; // Prompt 1: articles 1, 7
  obituary?: ArticlesPayload; // Prompt 2: article 8
  featureArticles?: ArticlesPayload; // Prompt 3: articles 2, 4, 6
  newsArticles?: ArticlesPayload; // Prompt 4: articles 3, 5
  components?: ComponentsPayload; // Hardcoded or generated
  images?: string[]; // Array of 4 image URLs in order: [article2_photo, article7_photo_left, article7_photo_right, article8_photo]
}
