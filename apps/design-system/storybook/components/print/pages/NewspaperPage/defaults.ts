import type { NewspaperInput, Article, WeatherBox, ArticlesPayload, ComponentsPayload } from "./types";

/* ─────────────────────────────────────────────
 * HARDCODED CONTENT — always present, not LLM-generated
 *
 * These are baked into every newspaper regardless of
 * mystery scenario. Exported so the assembly function
 * can merge them with the two JSON payloads.
 * ───────────────────────────────────────────── */

export const HARDCODED_WEATHER: WeatherBox = {
  high: "72°F",
  low: "51°F",
  description: "Clear skies, light westerly breeze",
  region: "Local Area",
  forecast: [
    { day: "Mon", high: "74°", low: "52°", icon: "☀" },
    { day: "Tue", high: "71°", low: "50°", icon: "⛅" },
    { day: "Wed", high: "68°", low: "49°", icon: "☁" },
    { day: "Thu", high: "65°", low: "47°", icon: "🌧" },
    { day: "Fri", high: "63°", low: "46°", icon: "🌧" },
    { day: "Sat", high: "67°", low: "48°", icon: "⛅" },
    { day: "Sun", high: "70°", low: "50°", icon: "☀" },
  ],
};

export const HARDCODED_POSIE: Article = {
  id: "posie",
  type: "flavor",
  headline: "Local Dog Saves Owner",
  body: 'Posie, a two-year-old Pomeranian, was awarded the Napa Valley Pet Community Hero Award after alerting her sleeping owner to a kitchen fire early Tuesday morning.\n\nOwner Helen Matsuda, 74, of St. Helena, said she was asleep when Posie began barking persistently at approximately 3:15 AM. "She never barks at night," Matsuda said. "I knew something was wrong." Matsuda discovered a grease fire spreading from the stovetop to the kitchen curtains. She was able to extinguish the blaze with a fire extinguisher before the St. Helena Fire Department arrived.\n\nFire Chief Robert Almada said the early alert likely prevented significant structural damage and possible injury. "That little dog saved the day," Almada said at a brief ceremony at City Hall on Thursday. Posie received a commemorative collar and a year\'s supply of treats from Valley Pet Supply.',
  hasPhoto: true,
  photoUrl: "https://res.cloudinary.com/sonik/image/upload/c_fill,ar_1:1,w_400/v1772350726/finalalibi/posie.jpg",
  photoCaption: "Posie, the Pomeranian honored for saving her owner from a house fire.",
  photoAspect: "square",
};

/* ─────────────────────────────────────────────
 * GENERIC COMPONENTS — hardcoded defaults
 *
 * Use this as the default Components JSON when you
 * don't want to generate these via LLM. Generic enough
 * to work with any mystery setting.
 * ───────────────────────────────────────────── */

export const GENERIC_COMPONENTS: ComponentsPayload = {
  masthead: {
    paperName: "THE DAILY CHRONICLE",
    tagline: "Your Trusted Source Since 1952",
    date: "Sunday, March 15, 2026",
    price: "$2.50",
    edition: "Morning Edition",
  },
  breakingBanner: {
    label: "INVESTIGATION UPDATE",
    headline: "AUTHORITIES CONTINUE INVESTIGATION INTO SUSPICIOUS DEATH",
  },
  sheriffStatement: {
    id: "sheriff",
    label: "BREAKING",
    headline: "Officials Issue Statement On Ongoing Investigation",
    body: "Local authorities have requested all witnesses remain available for follow-up interviews in the coming days. A forensic perimeter has been established at the scene. The medical examiner's office expects to release preliminary findings within 48 to 72 hours, according to a spokesperson. The location remains closed to visitors until further notice. A press conference has been scheduled for Monday morning. Anyone with information is urged to contact the tip line. Detectives from the Major Crimes division have been assigned to the case.",
  },
  editorsNote: {
    id: "editor",
    label: "EDITOR'S NOTE",
    headline: "Our Coverage Continues As The Story Develops",
    body: "The Daily Chronicle is committed to fair, accurate, and responsible reporting of this developing story. We will update readers in print and online as new information is released by law enforcement. Tips may be submitted confidentially to our newsroom. All sources will be protected. We urge the community to cooperate fully with investigators and to refrain from speculation that could hinder the progress of the case. Additional reporting staff have been assigned to ensure comprehensive and timely coverage.",
  },
  horoscopes: [
    {
      sign: "Aries",
      dates: "Mar 21–Apr 19",
      text: "A confrontation you have been avoiding can no longer wait. The longer you delay, the more it costs you. Face it directly.",
    },
    {
      sign: "Taurus",
      dates: "Apr 20–May 20",
      text: "Material concerns weigh heavily this week. Consider carefully whether the price — financial or otherwise — is truly worth paying.",
    },
    {
      sign: "Gemini",
      dates: "May 21–Jun 20",
      text: "Two competing truths demand your attention. Only one is the real story. Take time to distinguish fact from feeling.",
    },
    {
      sign: "Cancer",
      dates: "Jun 21–Jul 22",
      text: "Family loyalties are tested in unexpected ways. Examine where your allegiances truly lie before events make the choice for you.",
    },
    {
      sign: "Leo",
      dates: "Jul 23–Aug 22",
      text: "Your public image has long mattered deeply — perhaps too much. What are you protecting, and at what cost?",
    },
    {
      sign: "Virgo",
      dates: "Aug 23–Sep 22",
      text: "Details you overlooked are returning to significance. Go back and look again. Something important was hiding in plain sight.",
    },
    {
      sign: "Libra",
      dates: "Sep 23–Oct 22",
      text: "Balance is elusive when secrets tip the scales. The path to equilibrium runs through honesty, even uncomfortable honesty.",
    },
    {
      sign: "Scorpio",
      dates: "Oct 23–Nov 21",
      text: "Secrets buried for months may resurface with force. Prepare yourself. The reckoning has been building quietly.",
    },
    {
      sign: "Sagittarius",
      dates: "Nov 22–Dec 21",
      text: "Your instincts have been right all along. Trust what you already suspect. The evidence is there if you look.",
    },
    {
      sign: "Capricorn",
      dates: "Dec 22–Jan 19",
      text: "Ambition casts a shadow. Examine your motives with unusual care before taking the next step.",
    },
    {
      sign: "Aquarius",
      dates: "Jan 20–Feb 18",
      text: "An unexpected alliance proves more valuable than anticipated. Not all friendships are what they seem on the surface.",
    },
    {
      sign: "Pisces",
      dates: "Feb 19–Mar 20",
      text: "Escape is tempting. But the truth follows wherever you go. Better to turn and face it here.",
    },
  ],
  bestsellers: {
    category: "Fiction",
    books: [
      { rank: 1, title: "The Inheritance Games", author: "Jennifer Lynn Barnes" },
      { rank: 2, title: "A Good Girl's Guide to Murder", author: "Holly Jackson" },
      { rank: 3, title: "14 Ways to Die", author: "Vincent Chu" },
      { rank: 4, title: "Everyone In My Family Has Killed Someone", author: "Benjamin Stevenson" },
      { rank: 5, title: "The Family Game", author: "Catherine Steadman" },
      { rank: 6, title: "The Maid", author: "Nita Prose" },
      { rank: 7, title: "Arsenic and Adobo", author: "Mia P. Manansala" },
      { rank: 8, title: "The House in the Pines", author: "Ana Reyes" },
      { rank: 9, title: "The Last Thing He Told Me", author: "Laura Dave" },
      { rank: 10, title: "The Silent Patient", author: "Alex Michaelides" },
    ],
  },
  classifieds: [
    {
      id: "cl_1",
      category: "SERVICES",
      text: "Debt consolidation — fast, discreet, confidential. No credit check required. Free initial consultation. Call today.",
    },
    {
      id: "cl_2",
      category: "FOR SALE",
      text: "Vintage collection — over 200 items including rare reserves. Climate-controlled storage. Serious inquiries only. By appointment.",
    },
    {
      id: "cl_3",
      category: "LOST & FOUND",
      text: "Small gold locket, initials engraved on back. Lost downtown Saturday evening. Substantial reward offered, no questions asked.",
    },
    {
      id: "cl_4",
      category: "EMPLOYMENT",
      text: "Manager wanted for established property. Must have 5+ years experience and strong references. Live-in quarters available.",
    },
    {
      id: "cl_5",
      category: "SERVICES",
      text: "Private investigation — discreet, licensed, and bonded. Background checks, surveillance, missing persons. 20 years experience. Free consultation.",
    },
    {
      id: "cl_6",
      category: "RENTALS",
      text: "Furnished cottage. One bedroom, updated kitchen, excellent views. $2,800/mo, 12-month lease minimum. No pets, no smoking. References required.",
    },
  ],
};

/* ─────────────────────────────────────────────
 * STORYBOOK SAMPLE — wine murder scenario for preview
 *
 * This is example content only. In production, the LLM
 * generates Articles JSON + Components JSON per scenario.
 * The component itself is scenario-agnostic.
 * ───────────────────────────────────────────── */

export const defaultNewspaperContent: NewspaperInput = {
  masthead: GENERIC_COMPONENTS.masthead,
  breakingBanner: GENERIC_COMPONENTS.breakingBanner,

  /* ── ARTICLES ── */
  articles: [
    /* ── Front page articles ── */
    {
      id: "1",
      type: "main",
      headline: "Estate Manager Found Dead At Annual Harvest Gala",
      subheadline:
        "Police investigating suspicious circumstances at the Blackwell family vineyard; guests detained for questioning late into the night",
      byline: "By Sarah Connolly",
      body: "Antonio Reyes, 46, longtime estate manager of the historic Blackwell family vineyard, was discovered unresponsive in the property's private wine cellar late Saturday evening during the annual harvest gala — one of Napa Valley's most eagerly anticipated social events of the season. The discovery sent shockwaves through a crowd of nearly two hundred guests, many of whom had known Reyes personally for years.\n\nFirst responders were called to the estate at approximately 11:04 PM following a report by an unnamed guest who had gone to the cellar in search of a particular reserve vintage. Reyes was pronounced dead at the scene at 11:19 PM. Cass County Sheriff's Department confirmed Sunday morning that foul play has not been ruled out and that the investigation is being treated as a suspicious death pending full autopsy results from the county medical examiner's office.\n\n\"We are treating this as a suspicious death,\" said Sheriff's spokesperson Lt. Patricia Morales in a statement released early Sunday. \"We ask that anyone with information regarding the events of Saturday evening come forward at their earliest opportunity. No information is too small.\"\n\nThe gala, which this year celebrated the estate's 40th consecutive harvest season, was cut short when attendees were asked to remain on the premises for questioning by Cass County detectives. Several guests described the mood as \"chaotic\" and \"deeply unsettling\" in the hours following the discovery. Catering staff were among the last to be released, departing the property shortly before 3 AM Sunday morning.\n\nReyes had served the Blackwell family for eleven years and was widely regarded in the regional wine community as an exacting professional with an encyclopedic knowledge of the estate's extensive underground cellar system. He is survived by his wife, Maria, and two adult children.\n\nThe Blackwell Estate, one of the oldest continuously operating vineyards in Napa Valley, has been in the family for four generations. Its annual harvest gala, traditionally held on the second Saturday in October, has long been considered the social event of the season in Napa's wine country. This year's event had drawn an expanded guest list of nearly two hundred attendees, including several prominent regional figures and at least one member of the Cass County Board of Supervisors.\n\nThe investigation is ongoing. The Sheriff's Department is expected to release a formal statement Monday morning. The medical examiner's office declined to comment on a potential timeline for the autopsy report.\n\nA candlelight vigil is being organized by community members for Tuesday evening at Veterans Memorial Park in downtown St. Helena. Reyes's family has asked for privacy during this time.",
    },
    {
      id: "2",
      type: "flavor",
      headline: "Silverado Trail Bridge Reopens After Three-Year Restoration",
      subheadline:
        "Historic 1927 stone span restored with original materials; community celebrates with ribbon-cutting ceremony",
      byline: "By Linda Park",
      hasPhoto: true,
      photoCaption:
        "The restored Silverado Trail Bridge, originally built in 1927, reopened Saturday after a three-year, $4.7 million restoration project.",
      photoAspect: "landscape",
      body: 'The Silverado Trail Bridge, a beloved Napa Valley landmark closed to vehicle traffic since 2021, reopened Saturday following a $4.7 million restoration that preserved the original 1927 stonework while meeting modern safety standards.\n\nCounty Supervisor Diana Marsh and Caltrans District 4 Director Paul Tanaka cut the ribbon at a ceremony attended by more than three hundred residents, many of whom had driven miles out of their way for three years to avoid the closure. "This bridge is more than concrete and stone," Marsh said. "It\'s part of the story of this valley."\n\nThe restoration involved dismantling and cataloging more than 1,400 individual stones from the bridge\'s parapet walls, reinforcing the underlying steel structure, and reassembling the stonework in its original configuration. Workers sourced matching limestone from the same Northern California quarry that supplied the original builders nearly a century ago.\n\nProject engineer Rebecca Liu said the most challenging phase was stabilizing the center arch, which had developed a hairline fracture identified during a 2019 inspection. "We essentially had to build a bridge inside a bridge," Liu explained. "The new steel framework sits entirely within the original stone shell."\n\nThe bridge, which carries Silverado Trail over Rector Creek approximately two miles south of the Blackwell Estate, is listed on the National Register of Historic Places. It is one of only four remaining stone arch bridges in Napa County.',
    },
    {
      id: "3",
      type: "red_herring",
      headline: "Bay Area Pharma Firm Reports Inventory Discrepancy",
      subheadline: "FDA notified after quarterly audit flags missing controlled compounds",
      byline: "By Tom Hargrove",
      body: 'A Bay Area pharmaceutical distribution firm has filed a mandatory report with the FDA after a routine quarterly audit revealed a discrepancy in its controlled compound inventory, sources familiar with the matter confirmed Friday. The firm, which declined to be identified pending the investigation, said the missing substances — classified as Schedule IV compounds — were unaccounted for across a period spanning July through mid-September.\n\nNo arrests have been made. Federal investigators say the probe is in its early stages. The compounds in question are commonly used as sedatives and muscle relaxants. While not considered high-risk narcotics, Schedule IV substances are subject to strict federal tracking requirements and any unaccounted shortage must be reported to the FDA within 30 days of discovery.\n\nIndustry analysts noted that inventory discrepancies of this nature, while relatively rare in licensed distribution networks, have been documented with increasing frequency over the past eighteen months. "It could be a clerical error, a software glitch, or something more deliberate," said Dr. Ramesh Gupta, a pharmaceutical compliance consultant based in San Francisco. "The critical thing now is the paper trail."',
    },
    {
      id: "4",
      type: "cameo",
      headline: "Local Vintner Takes Home Winemaker of the Year",
      subheadline: "Elena Chen recognized for outstanding 2022 Reserve Cabernet",
      byline: "By Mattie Sims",
      body: "Elena Chen, head winemaker at one of the valley's most respected estates, received the Napa Valley Regional Winemaker of the Year award at the annual harvest luncheon Saturday afternoon. Chen, who has overseen her estate's acclaimed cellar program for six years, was recognized for her work on the 2022 Reserve Cabernet Sauvignon, which received a 97-point rating from Wine Advocate earlier this year.\n\nIn her acceptance speech, Chen thanked her team and spoke warmly of the community that has supported her career. \"Everything I've learned, I've learned from the people around me — the growers, the coopers, the people who tend these vines every day,\" she said.\n\nChen joined the valley in 2015 after a decade at several prominent Sonoma County wineries. She is widely regarded as one of the most talented young winemakers in the region.",
    },
    {
      id: "5",
      type: "secondary",
      label: "LOCAL NEWS",
      headline: "Harvest Festival Postponed Following Estate Tragedy",
      byline: "By Diane Kowalski",
      body: 'Organizers of the annual downtown Cass Valley harvest parade announced Sunday that the event, scheduled for next weekend, will be postponed indefinitely out of respect for the Blackwell family and the victim\'s loved ones. "Our community is grieving," said parade chair Diane Russo. "Now is not the time for celebration." A revised date is expected to be announced later this month. The festival typically draws over ten thousand visitors and generates an estimated $2.4 million in local economic activity. Local business owners expressed understanding but noted the financial impact would be significant for downtown merchants who had already placed orders for the event. The Cass Valley Downtown Business Alliance issued a statement urging patience and solidarity. "We will get through this together," said alliance president Robert Yee. City officials confirmed that vendors who had already paid booth fees would receive full refunds.\n\nThe postponement marks the first time in the festival\'s 38-year history that the event has been cancelled. Several downtown restaurants that had planned special harvest menus said they would proceed with their offerings regardless. "The community still needs to eat," said Maria Torres, owner of Vine & Table on Main Street. Tourism officials estimate the delay could affect hotel bookings across the valley for the remainder of October.',
    },
    {
      id: "6",
      type: "flavor",
      headline: "County Fair Pie Contest Draws Record Entries",
      subheadline: "Blue-ribbon bakers compete across 14 categories at annual autumn event",
      byline: "By Linda Park",
      body: "The 38th annual Cass County Fair pie-baking contest drew a record 127 entries this year, up from last year's 104, organizers announced Saturday. Competition was particularly fierce in the traditional fruit category, where nine-time champion Dorothy Whitfield of St. Helena faced stiff competition from newcomer Raj Patel, whose cardamom-pear tart drew audible gasps from the judging panel.\n\nWhitfield ultimately prevailed, securing her tenth blue ribbon with a classic lattice-top cherry pie that head judge Martha Reese described as \"technically flawless and emotionally devastating.\" Patel took second place and the award for most innovative entry.\n\nThe contest, held in the fairgrounds exhibition hall, has become one of the county's most beloved autumn traditions. Entry fees support the Cass County 4-H youth agriculture program. Full results will be published in Tuesday's edition.",
    },

    /* ── Back page articles ── */
    {
      id: "7",
      type: "continuation",
      headline: "A Night of Celebration Turned To Tragedy",
      subheadline: "Witness accounts paint a picture of simmering tension beneath the surface of Saturday's gala",
      byline: "By Sarah Connolly",
      body: 'Continued from front page — Guests who attended Saturday\'s harvest gala described an evening that began with the usual warmth and conviviality of the Blackwell family\'s annual tradition, but felt, in retrospect, strained in ways that were difficult to articulate until the news broke.\n\nSeveral attendees recalled a heated exchange near the entrance to the estate\'s east wing sometime between 9 and 10 PM, though no one was willing or able to confirm the identities of those involved. One guest, who asked not to be named, described raised voices and a door closing sharply. "It was tense, but these events always have their little dramas," the guest said.\n\nThe Sheriff\'s office declined to name any persons of interest but confirmed that multiple individuals present at the gala were re-interviewed at the station Sunday morning. A forensic team was photographed departing the estate with sealed evidence containers at approximately 11:45 AM.\n\nAmong those seen arriving at the county sheriff\'s station Sunday morning were members of the Blackwell family, including Richard Blackwell\'s daughter Sophia, who had first discovered the body, and his son James, who had traveled from San Francisco for the event.\n\nReyes had served the Blackwell family for eleven years and was regarded by those who knew him as meticulous, intensely loyal, and — some added with hesitation — quietly troubled in recent months. A long-serving colleague who requested anonymity said Reyes had seemed "distracted" and "not himself" in the weeks preceding the gala, though the colleague declined to speculate on the cause.\n\nThe medical examiner\'s office confirmed that a preliminary autopsy would be conducted Monday morning, with initial toxicology results expected within five to seven business days. A full report, investigators cautioned, could take several weeks. Meanwhile, the estate remains closed to all visitors and scheduled tours have been cancelled indefinitely.\n\nNeighbors along Silverado Trail described an atmosphere of quiet unease Sunday, with law enforcement vehicles still visible on the property well into the afternoon. "You don\'t see that kind of presence here," said long-time resident Margaret Chen. "It\'s unsettling."\n\nThe gala\'s guest list, obtained by the Register, included several prominent figures in the Napa Valley business and social community: real estate developer Marcus Holloway, San Francisco attorney Catherine Blackwell-Price — the family\'s longtime legal counsel — and Dr. Julian Navarro, a retired forensic pathologist who had recently moved to the valley from Los Angeles. Investigators have not indicated whether any guests are considered persons of interest.\n\nCatering staff from Vine & Table, the downtown St. Helena restaurant contracted to provide food and beverage service for the event, were among the last to leave the premises. Owner Maria Torres confirmed that her staff of fourteen had been interviewed individually by detectives before being released shortly before 3 AM. "My people are shaken," Torres said. "Some of them have worked Blackwell events for a decade. This was supposed to be a celebration."\n\nThe estate\'s main gate remained closed Sunday, with a single Cass County Sheriff\'s cruiser parked at the entrance. A hand-lettered sign affixed to the stone pillar read simply: "Estate Closed Until Further Notice." Delivery trucks scheduled for Monday\'s routine supply runs have been redirected, according to a distributor who asked not to be named.',
    },
    {
      id: "8",
      type: "obituary",
      headline: "Antonio Miguel Reyes, 1978–2024",
      subheadline:
        "Beloved estate manager remembered for quiet integrity, deep expertise, and unwavering devotion to craft",
      byline: "By Sarah Connolly",
      hasPhoto: true,
      photoCaption: "Antonio Reyes at the Blackwell Estate during the 2023 harvest season.",
      photoAspect: "portrait",
      body: "Antonio Miguel Reyes, beloved husband, father, and devoted steward of the Blackwell Estate, passed away on the evening of Saturday, October 12, 2024. Born in Sonoma County, Antonio spent his career in service to the Napa Valley wine community, bringing to his work a rare combination of technical expertise, unwavering attention to detail, and quiet personal warmth that earned him the deep respect of colleagues and peers alike.\n\nHe joined the Blackwell Estate eleven years ago and in that time became its institutional memory, the keeper of its most prized vintages and the guardian of traditions that stretched back generations. Those who worked alongside him described a man of uncommon integrity — someone who took immense pride in his craft, who never cut corners, and who treated every bottle in his care as though it were irreplaceable.\n\nAntonio was raised in Santa Rosa, the eldest of three children. He studied viticulture at UC Davis before beginning his career at a small family winery in Sonoma, where he developed the exacting standards that would define his professional life. Friends remember him as a quiet, generous man who could name every vine on the property and recall the weather conditions of every harvest he had overseen.\n\nHe is survived by his wife, Maria Elena Reyes; his children, Sofia (24) and James (21); his mother, Consuelo Reyes of Santa Rosa; and a large extended family throughout Northern California. Memorial service Thursday at 2 PM, St. Helena Catholic Church. In lieu of flowers, donations to the Napa Valley Agricultural Workers' Fund.",
    },
    HARDCODED_POSIE,
  ],

  /* ── SHORT NOTES (from Components JSON) ── */
  sheriffStatement: {
    id: "sheriff",
    label: "BREAKING",
    headline: "Sheriff Issues Statement On Estate Death",
    body: "Cass County investigators have requested all gala attendees remain available for follow-up interviews in the coming days. A forensic perimeter has been established around the estate wine cellar. The medical examiner's office expects to release preliminary findings within 48 to 72 hours, according to a spokesperson for the Sheriff's Department. The estate remains closed to visitors until further notice. A press conference has been scheduled for Monday at 10 AM at the Cass County courthouse. Anyone with information is urged to contact the tip line at 707-555-0100. Detectives from the Major Crimes division have been assigned to the case. Sheriff Rodriguez is expected to address the media personally at Monday's briefing.",
  },
  editorsNote: {
    id: "editor",
    label: "EDITOR'S NOTE",
    headline: "Our Coverage Continues As The Story Develops",
    body: "The Napa Valley Register is committed to fair, accurate, and responsible reporting of this developing story. We will update readers in print and online as new information is released by law enforcement. Tips may be submitted confidentially to tips@naparegister.com or by calling our newsroom at 707-555-0100. All sources will be protected. We urge the community to cooperate fully with investigators and to refrain from speculation that could hinder the progress of the case. Additional reporting staff have been assigned to ensure comprehensive and timely coverage. Readers should expect daily updates in print and continuous reporting online at naparegister.com/blackwell-case.",
  },

  /* ── SIDEBAR ── */
  sidebar: {
    weather: HARDCODED_WEATHER,
    bestsellers: {
      category: "Fiction",
      books: [
        { rank: 1, title: "The Inheritance Games", author: "Jennifer Lynn Barnes" },
        { rank: 2, title: "A Good Girl's Guide to Murder", author: "Holly Jackson" },
        { rank: 3, title: "14 Ways to Die", author: "Vincent Chu" },
        { rank: 4, title: "Everyone In My Family Has Killed Someone", author: "Benjamin Stevenson" },
        { rank: 5, title: "The Family Game", author: "Catherine Steadman" },
        { rank: 6, title: "The Maid", author: "Nita Prose" },
        { rank: 7, title: "Arsenic and Adobo", author: "Mia P. Manansala" },
        { rank: 8, title: "The House in the Pines", author: "Ana Reyes" },
        { rank: 9, title: "The Last Thing He Told Me", author: "Laura Dave" },
        { rank: 10, title: "The Silent Patient", author: "Alex Michaelides" },
      ],
    },
    horoscopes: [
      {
        sign: "Aries",
        dates: "Mar 21–Apr 19",
        text: "A confrontation you have been avoiding can no longer wait. The longer you delay, the more it costs you. Face it directly.",
      },
      {
        sign: "Taurus",
        dates: "Apr 20–May 20",
        text: "Material concerns weigh heavily this week. Consider carefully whether the price — financial or otherwise — is truly worth paying.",
      },
      {
        sign: "Gemini",
        dates: "May 21–Jun 20",
        text: "Two competing truths demand your attention. Only one is the real story. Take time to distinguish fact from feeling.",
      },
      {
        sign: "Cancer",
        dates: "Jun 21–Jul 22",
        text: "Family loyalties are tested in unexpected ways. Examine where your allegiances truly lie before events make the choice for you.",
      },
      {
        sign: "Leo",
        dates: "Jul 23–Aug 22",
        text: "Your public image has long mattered deeply — perhaps too much. What are you protecting, and at what cost?",
      },
      {
        sign: "Virgo",
        dates: "Aug 23–Sep 22",
        text: "Details you overlooked are returning to significance. Go back and look again. Something important was hiding in plain sight.",
      },
      {
        sign: "Libra",
        dates: "Sep 23–Oct 22",
        text: "Balance is elusive when secrets tip the scales. The path to equilibrium runs through honesty, even uncomfortable honesty.",
      },
      {
        sign: "Scorpio",
        dates: "Oct 23–Nov 21",
        text: "Secrets buried for months may resurface with force. Prepare yourself. The reckoning has been building quietly.",
      },
      {
        sign: "Sagittarius",
        dates: "Nov 22–Dec 21",
        text: "Your instincts have been right all along. Trust what you already suspect. The evidence is there if you look.",
      },
      {
        sign: "Capricorn",
        dates: "Dec 22–Jan 19",
        text: "Ambition casts a shadow. Examine your motives with unusual care before taking the next step.",
      },
      {
        sign: "Aquarius",
        dates: "Jan 20–Feb 18",
        text: "An unexpected alliance proves more valuable than anticipated. Not all friendships are what they seem on the surface.",
      },
      {
        sign: "Pisces",
        dates: "Feb 19–Mar 20",
        text: "Escape is tempting. But the truth follows wherever you go. Better to turn and face it here.",
      },
    ],
  },

  /* ── CLASSIFIEDS ── */
  classifieds: [
    {
      id: "cl_1",
      category: "SERVICES",
      text: "Debt consolidation — fast, discreet, confidential. No credit check required. Free initial consultation. Serving Napa & Sonoma counties for over 15 years. Call today: 707-555-0192.",
    },
    {
      id: "cl_2",
      category: "FOR SALE",
      text: "Vintage wine collection — over 200 bottles including rare Napa & Sonoma reserves, verticals from 1985–2020. Climate-controlled storage. Serious inquiries only. By appointment: 707-555-1100.",
    },
    {
      id: "cl_3",
      category: "LOST & FOUND",
      text: "Small gold locket, initials 'E.R.' engraved on back. Lost vicinity of downtown St. Helena, Saturday evening. Substantial reward offered, no questions asked. Contact Valley Wellness Center: 707-555-2210.",
    },
    {
      id: "cl_4",
      category: "EMPLOYMENT",
      text: "Estate manager wanted for established Napa family property. Must have 5+ years vineyard experience, knowledge of cellar operations, and strong references. Live-in quarters available. Contact: estatemgmt.napa@proton.me",
    },
    {
      id: "cl_5",
      category: "SERVICES",
      text: "Private investigation — discreet, licensed, and bonded. Background checks, surveillance, missing persons, insurance fraud. 20 years law enforcement experience. Free consultation: 707-555-3340.",
    },
    {
      id: "cl_6",
      category: "RENTALS",
      text: "Furnished cottage on Silverado Trail. One bedroom, updated kitchen, vineyard views. $2,800/mo, 12-month lease minimum. No pets, no smoking. References required. Available Nov. 1. Call: 707-555-4401.",
    },
  ],
};

/* ─────────────────────────────────────────────
 * ASSEMBLY — merges two JSON payloads + hardcoded content
 *
 * Called by the workflow to build the final NewspaperInput
 * from LLM-generated Articles + Components payloads.
 * ───────────────────────────────────────────── */

export function assembleNewspaper(articles: ArticlesPayload, components: ComponentsPayload): NewspaperInput {
  return {
    masthead: components.masthead,
    breakingBanner: components.breakingBanner,
    articles: [...articles.articles, HARDCODED_POSIE],
    sheriffStatement: components.sheriffStatement,
    editorsNote: components.editorsNote,
    sidebar: {
      weather: HARDCODED_WEATHER,
      horoscopes: components.horoscopes,
      bestsellers: components.bestsellers,
    },
    classifieds: components.classifieds,
  };
}
