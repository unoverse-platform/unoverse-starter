/* ─────────────────────────────────────────────
 * LAYOUT DEFINITIONS — internal to component
 *
 * These define WHERE content goes on each page.
 * Content (articles, sidebar data) is passed in separately.
 * ───────────────────────────────────────────── */

export type SlotRender =
  | "article"
  | "shortNote"
  | "photo"
  | "weather"
  | "horoscopes"
  | "bestsellers"
  | "classifieds"
  | "pullQuote";

export interface LayoutSlot {
  name: string;
  gridRow: string;
  gridColumn: string;
  render: SlotRender;
  /** For render:"article" — which article id to place here */
  articleId?: string;
  /** For render:"shortNote" — which component field to pull from */
  componentKey?: "sheriffStatement" | "editorsNote";
  /** Column count for article text flow */
  columns?: 1 | 2 | 3 | 4;
  /** Layout hint passed to NewsStory for special rendering modes */
  layoutHint?: "hero" | "sidebar" | "bottom" | "image-left";
  /** For shortNote slots — dark or light variant */
  variant?: "dark" | "light";
  /** For photo slots — caption and byline baked into layout */
  photoCaption?: string;
  photoByline?: string;
  photoAspect?: "landscape" | "portrait" | "square" | "wide";
  /** For photo slots — dynamic image URL */
  photoUrl?: string;
}

export interface PageLayout {
  gridRows: string;
  showMasthead: boolean;
  showBreakingBanner: boolean;
  slots: LayoutSlot[];
}

/*
 * FRONT PAGE GRID:
 *
 *         col1      col2      col3      col4
 * row1:  [ hero article (1-3)     ][ dark note  ]   3fr
 * row2:  [ bridge (1-2) ][ pharma ][ cameo      ]   4fr
 * row3:  [ weather ][ local (2-3) ][ flavor     ]   2.5fr
 * row4:  [          classifieds (1-4)            ]   1fr
 */
export const FRONT_LAYOUT: PageLayout = {
  gridRows: "3fr 4fr 2.5fr 1fr",
  showMasthead: true,
  showBreakingBanner: false,
  slots: [
    // Row 1
    { name: "front_r1_main", gridRow: "1", gridColumn: "1 / 4", render: "article", articleId: "1", columns: 3 },
    {
      name: "front_r1_note",
      gridRow: "1",
      gridColumn: "4",
      render: "shortNote",
      componentKey: "sheriffStatement",
      variant: "dark",
    },

    // Row 2
    { name: "front_r2_left", gridRow: "2", gridColumn: "1 / 3", render: "article", articleId: "2", columns: 2 },
    { name: "front_r2_mid", gridRow: "2", gridColumn: "3", render: "article", articleId: "3", columns: 1 },
    { name: "front_r2_right", gridRow: "2", gridColumn: "4", render: "article", articleId: "4", columns: 1 },

    // Row 3
    { name: "front_r3_weather", gridRow: "3", gridColumn: "1", render: "weather" },
    { name: "front_r3_mid", gridRow: "3", gridColumn: "2 / 4", render: "article", articleId: "5", columns: 2 },
    { name: "front_r3_right", gridRow: "3", gridColumn: "4", render: "article", articleId: "6", columns: 1 },

    // Row 4
    { name: "front_r4_classifieds", gridRow: "4", gridColumn: "1 / 5", render: "classifieds" },
  ],
};

/*
 * BACK PAGE GRID:
 *
 *         col1      col2      col3      col4
 * row1:  [ photo (1-2)       ][ photo (3-4)     ]   2.5fr
 * row2:  [ continuation (1-3)     ][ dark note  ]   3fr
 * row3:  [ best  ][ horoscopes (2-3) ][ posie   ]   3.5fr
 * row4:  [         obituary (1-4)                ]   3fr
 */
export const BACK_LAYOUT: PageLayout = {
  gridRows: "2.5fr 3fr 3.5fr 3fr",
  showMasthead: false,
  showBreakingBanner: true,
  slots: [
    // Row 1
    {
      name: "back_r1_photo_left",
      gridRow: "1",
      gridColumn: "1 / 3",
      render: "photo",
      photoCaption:
        "The Blackwell estate wine cellar entrance, cordoned off by investigators early Sunday morning. Forensic technicians were seen removing sealed containers from the premises.",
      photoAspect: "landscape",
      photoByline: "Photo: Sarah Connolly / Napa Valley Register",
    },
    {
      name: "back_r1_photo_right",
      gridRow: "1",
      gridColumn: "3 / 5",
      render: "photo",
      photoCaption:
        "Gold guests and catering staff gathered at the estate's north lawn awaiting clearance from Cass County Sheriff's deputies. Many waited over three hours before being allowed to leave.",
      photoAspect: "landscape",
      photoByline: "Photo: Marcus Webb / Napa Valley Register",
    },

    // Row 2
    {
      name: "back_r2_main",
      gridRow: "2",
      gridColumn: "1 / 4",
      render: "article",
      articleId: "7",
      columns: 3,
    },
    {
      name: "back_r2_note",
      gridRow: "2",
      gridColumn: "4",
      render: "shortNote",
      componentKey: "editorsNote",
      variant: "dark",
    },

    // Row 3
    { name: "back_r3_bestsellers", gridRow: "3", gridColumn: "1", render: "bestsellers" },
    { name: "back_r3_horoscopes", gridRow: "3", gridColumn: "2 / 4", render: "horoscopes" },
    { name: "back_r3_right", gridRow: "3", gridColumn: "4", render: "article", articleId: "posie", columns: 1 },

    // Row 4
    {
      name: "back_r4_full",
      gridRow: "4",
      gridColumn: "1 / 5",
      render: "article",
      articleId: "8",
      columns: 4,
      layoutHint: "image-left",
    },
  ],
};
