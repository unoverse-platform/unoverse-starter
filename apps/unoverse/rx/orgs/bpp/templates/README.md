# Unoverse templates

Template (layout / MCP-App) definitions — neutral primitive trees that read the
**single shared state** (history + components) and arrange it. A template **owns
nothing**: it reads the store and lays out what it finds, so it is swappable
without losing the conversation (`UNOVERSE_SPEC.md` §2e-0).

## Authored

- **`keyservice.json`** — split layout. Reference template; exercises
  `ComponentSlot` (filter components by type into layout regions) + `Skeleton`
  fallbacks. See `UNOVERSE_SPEC.md` §2e ("Template primitives").

- **`sabchatlayout/`** (folder; entry `sabchatlayout.json` + `$include` parts) —
  the SAB-branded chat surface, composed entirely in **data**:
  - **Welcome screen** on `isEmpty` — logo, brand, subtitle, and starter-prompt
    buttons (`Each` over `suggestions`; each `Button` sends its prompt).
  - **Conversation** on `hasMessages` — a bottom-anchored `Timeline` whose `user`
    turns are red bubbles (`user-turn.json`) and `assistant` turns are an avatar +
    `ComponentSlot` + a relative timestamp (`assistant-turn.json`).
  - **Thinking dots** (`thinking-dots.json`) shown while a turn is `streaming` AND
    `empty` — pure data, animated via the served `wave` keyframe (`style.animation`).
  - **Pill composer** (`composer-bar.json`) — leading `chat` icon + a controlled
    `Input` (binds the shared `draft`) + `mic`/`send` icons; Enter or the send
    button submits.

  The workflow selects this template via `WORKFLOW_STARTED` `metadata.template`
  (`UNOVERSE_SPEC.md` §5b); the channel loads it with the official
  `resources/read unoverse://templates/SABChatLayout`. It is **never** streamed as
  a component.

## Primitives & vocab it relies on (all implemented in the web SDK)

- **Structural:** `Box`/`Row`/`Column`, `Each` (map an array), `ComponentSlot` /
  `Timeline` (project the store's timeline; `Timeline` renders per-turn `user` /
  `assistant` sub-trees).
- **Leaves:** `Text`, `Image`, `Button` (label *or* composed children), `Input`
  (local *or* controlled via `bind.value`), `Markdown`, `Skeleton`, `Icon`
  (served glyph — the pack lives on the server, never the SDK).
- **Style vocab:** design tokens + `style.animation` → served `theme.keyframes`;
  served recipes (`theme.prose`, `theme.skeleton`, `theme.icons`). The SDK authors
  **zero** style values (golden-rule enforced).
- **Neutral state the renderer projects into scope** (never UX policy): root
  `isEmpty` / `hasMessages` / `draft`; per-turn `text` / `time` / `streaming` /
  `empty` / `active`. Definitions compose conditions with `visibleWhen`
  (nesting = logical AND).

## How a template renders

`resources/read unoverse://templates/{name}` (MCP — the recipe, served by the
definition server) → the renderer walks the primitive tree → each `ComponentSlot` /
`Timeline` projects the store's timeline (select → filter by `typeOf` → render each
pointer's leaf via `StreamedUnoverseComponent`). Live component data arrives
separately over the channel's data-plane stream into the **same store**. Recipe =
served definition; conversation = the store. The two are joined only by the store.
