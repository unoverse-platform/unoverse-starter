# Unoverse — The SDUI State Model

> **Status**: 🟢 Built (June 2026) — the source of truth for the client state, and the SDK
> now matches it (the state machine is **feature-free in code**). §8 = remaining wiring;
> §9 = the concrete as-built SDK surface (store API, wire messages, action verbs).
> **Companion to**: [`UNOVERSE_SPEC.md`](./UNOVERSE_SPEC.md) (rendering),
> [`UNOVERSE_MCP_TEMPLATE_PROTOCOL.md`](./UNOVERSE_MCP_TEMPLATE_PROTOCOL.md) (transport),
> [`UNOVERSE_LAYERS.md`](./UNOVERSE_LAYERS.md) (how state organizes UI — `layouts/` + `states/` + `components/`).
>
> **One line:** the client holds **three buckets — conversation, component state, template
> state** — written by **two generic paths** (merge into a component, or into template state).
> The engine knows no feature names; all UX is data.

---

## 1. The principle (the why)

The SDK `core` is a **generic engine**. It knows about *messages* and *generic state
buckets* — **never about features**. The strings `faq`, `suggestions`, `voice`, `tab`,
`wizard` must not appear in `core`. The engine routes incoming data into the right
bucket; **templates and components project that state into UI**. All UX lives in data
(definitions), not in the engine.

This is the rule everything below serves. When a feature name leaks into `core` (a
`suggestions` slice, a `SUGGESTIONS_UPDATE` case, faq-shape normalization), that is the
violation — see §8.

---

## 2. The state — three buckets, named by owner

| Bucket | Holds | Scoped / keyed by | Written by |
|---|---|---|---|
| **Conversation** | the timeline of turns (user + assistant); each assistant turn points at the components it produced; the turn's status (streaming / complete); **the voice transcript (what was said)** | the conversation | the stream; the voice service (transcript) |
| **Component state** | one slice per component — its live data **and** its own view state (tab, edit mode, wizard step, expand/collapse) | the component's **unique id** | streamed `COMPONENT_DATA`, or locally via the `setValue` action |
| **Template state** | the active template's own bag — **draft** plus any keys the dev names: e.g. `openPanel` (disclosure), suggestion/FAQ data, the `defaultState` key (`"focus"`), **voice call state** (connecting / speaking / muted) | the active template | the workflow; `setTemplateValue` actions; producer services (voice call state) |

### The whole write API — two generic actions

- **`setValue`** → write the dev's keys into a **component's own slice** (`<id>`)
- **`setTemplateValue`** → write the dev's keys into **template state**

That is the entire surface. The SDK hardcodes **no UI concept** — `openPanel`, focus, a
tab, a wizard step, `faqs` are all just **keys the dev names**, written via these two
actions and read via `visibleWhen`. **The dev picks the key AND the bucket.** Adding a
feature is **data**, never a new bucket, action, or `case` in `core`.

---

## 3. Derived, not stored: `lifecycle`

"Is the assistant thinking / streaming / done" is **not a separate bucket**. The
conversation already tracks each turn's status (streaming → complete). `lifecycle` is
**read off the conversation**, then projected as a flag (`isStreaming`, …) for
`visibleWhen`. It is a *view* of the conversation, not its own state.

**What flips the turn streaming → complete:** that run's `WORKFLOW_STATE` message —
`WORKFLOW_STARTED` opens the turn, `WORKFLOW_COMPLETED` closes it. This is **run-scoped**
state, so it arrives on the **MCP `/stream`** (the local lane), *not* the SDK WS
(`UNOVERSE_MCP_TEMPLATE_PROTOCOL.md` §5b, two-lane split). If `WORKFLOW_COMPLETED` never
reaches the stream, the turn stays `streaming` forever and every derived flag stays true —
e.g. AIResponse's injected `streaming` flag never clears and the thinking-dots bounce
after the answer is done. That is a delivery gap (lifecycle emitted by the engine but not
projected onto `/stream` by the MCP engine), **not** a component bug — fix it at the MCP
engine, never by gating the dots on component text.

---

## 4. Services feed the state — they are not state

A **service** is a native capability the SDK provides as the sanctioned escape hatch
(`UNOVERSE_SPEC.md` §2e-1) — for things that **cannot be expressed as data**. A service
is a **producer**: it does native I/O and writes its derived state into the normal
buckets. It is *not* a fourth kind of state.

**Voice** is the canonical service, and it splits cleanly in two:

| Voice piece | Nature | Lands in |
|---|---|---|
| mic / speaker / WS audio **frames** | native I/O — cannot be data | the **service** (`useVoiceService`, on the `/ws/gravity` lane) |
| **call state** (connecting / connected / speaking / muted) | UI state of the voice template | **template state** |
| **transcript** (the words said) | conversation content | **conversation** |

So the voice service does the audio, and as a producer it writes **call state →
template state** and **transcript → conversation**. The template reads voice state the
**same way** it reads `draft` or `suggestions` — there is no voice-specific path and no
voice name in `core`. (The dead in-`core` voice machine has already been removed.)

**The standard call-phase field — `callState`.** So a voice template branches its
call-phase states off **one** value (exactly like `defaultState` for focus, §5a), the service
projects a single derived `callState`: **`idle` · `active` · `agentSpeaking` ·
`userSpeaking`** (from `connectionStatus` + the speaking flags — agent wins over user on
barge-in). The template's states are then `visibleWhen: { field: "callState", eq: "…" }`
— the phase axis — while `defaultState: "focus"` is the orthogonal surface axis. The channel
spreads the service's flat state (incl. `callState`) into the scope via `props`, so any
voice template keys off the same vocabulary with zero per-template wiring. The raw booleans
(`isAssistantSpeaking`, `isMuted`, …) stay available for finer reads (e.g. a mute icon).

> **The rule services follow:** a service may *own native I/O*, but its *state lives in
> the normal buckets*. If state that drives UI lives only inside a service hook, that is
> the same leak as a feature name in `core` — surfaced as a props side-channel instead
> of the uniform state path.

---

## 5. Focus is not special — it's the dev's choice of bucket

There is **no focus concept in the SDK** — no `focusedId`, no derivation, no verb. "Focus
mode" is built like anything else, and the dev picks where the state lives:

- **A self-expanding widget** (a product finder, a transfer wizard) → its focused/inline look is
  **its own state**: `setValue { defaultState: "focused" | "inline" }` into its slice, read
  via `visibleWhen: { field: "defaultState", … }`. One component, its own business.
- **A screen-wide "something is focused" signal** (e.g. hide the chat input while a widget
  is expanded) → the **template-state** key **`defaultState`** (a value, not a boolean — §5a; renamed from `mode`, July 2026):
  `setTemplateValue { defaultState: "focus" }`, read via `visibleWhen: { field: "defaultState", eq: "focus" }`.
  A widget can chain both with `then` — set its own `defaultState`,
  *then* flag the template.

The SDK neither stores nor derives focus — it just moves the dev's keys. (An earlier
`focusedId` / renderer-derived-`defaultState` design was removed: it hardcoded a focus
concept, which is exactly what this model forbids.)

| Behavior | Where the dev puts it | How it's read |
|---|---|---|
| A widget's own focused/inline look | its slice via `setValue { defaultState }` | `visibleWhen: { field: "defaultState", … }` |
| A screen-wide focus surface (hide input, etc.) | template state via `setTemplateValue { defaultState: "focus" }` | `visibleWhen: { field: "defaultState", eq: "focus" }` |

> **⚠️ Superseded (July 2026) — see §5b.** The second row (a component chaining
> `setTemplateValue { defaultState: "focus" }` to open the template's surface) is the
> OLD bridge. Under the reaction contract, a component writes **only its own slice**
> (`setValue { defaultState: "focused" }`) and the template *reacts* via a state
> selector — template-focus is derived, not stored. The `setTemplateValue` verb
> remains for state that is genuinely the template's own (panels, draft).

### 5a. Focus rendering is **template-local** — same `defaultState`, different surface per template

> **⚠️ Mechanics superseded (July 2026) — see §5b.** What SURVIVES from this section:
> the surface is each template's own business (the table below), arrival states are open
> names, unknown names are inert. What CHANGES: the signal is no longer a template-state
> key written via `TEMPLATE_DATA` / `setTemplateValue` — the component's state lives in
> **its own slice** (arrival data or `setValue`), and the template surface **selects on
> it** (`ComponentSlot.select.where`). The `TEMPLATE_DATA { defaultState }` emit and the
> user-action `setTemplateValue` writes described below are the old bridge, to be swept
> as templates migrate to selectors.

The screen-wide signal is a single template-state key, **`defaultState`** (a *value*, not a per-feature
boolean — so future modes branch with zero protocol change). *How* a mode looks is **each
template's own business**: every template branches on `defaultState` (`visibleWhen: { field: "defaultState", eq:
"focus" }` or a `Switch`) and renders **its own surface** — the SDK neither knows nor imposes a
shape:

| Template | `defaultState: "focus"` surface |
|---|---|
| a **chat** template | a **fluid overlay covering header→input** — a full-screen takeover laid over the conversation |
| a **voice** template | a **right-hand focus panel** that streamed cards slide into during the call |

Same `defaultState: "focus"`, two completely different renderings — because the surface lives in the
template definition, not the SDK. A new template (or a new mode value) can present any way it
likes (modal, sheet, split) with zero SDK change.

**Who sets it, on load.** The **component's own node** does — declared in its definition
envelope: `defaultState: "<name>"` (an OPEN name; the legacy derivation — a `defaultState`
prop defaulting `"focused"` ⇒ `"focus"` — remains as fallback). The universal component node passes it through
(`metadata.defaultState`) and the generated node emits `TEMPLATE_DATA { defaultState: "<name>" }`
**on publish**, alongside its `COMPONENT_INIT`. So the active template reacts the instant the
widget streams in. The name is the contract, not an enum:
- a wizard declares `"focus"` → the template opens its focus surface (the load-time
  equivalent of a user expanding it);
- a CourseCard declares `"course"` → a template that defines a `course` state frames the
  arriving cards its own way (a rail, a grid, anything); one that doesn't simply renders
  them inline in the flow — unknown names are inert, so new arrival states ship with zero
  protocol change.
The user's own expand/close actions write the same key (`setTemplateValue { defaultState:
"focus" }` / back to the arrival name, e.g. `{ defaultState: "course" }`).
The **component stays fit-to-content** (its own card); the **template** decides the framing.

This pairs with the **app**-level `defaultState` (manifest, formerly `mode` — still read as fallback; `template` = fluid surface · `focus` = fit
content — [`UNOVERSE_MCP_TEMPLATE_PROTOCOL.md`](./UNOVERSE_MCP_TEMPLATE_PROTOCOL.md) §4b): the
manifest `defaultState` sets the app's height/routing, the streamed component's node sets the live
`defaultState` template-state value the surface reads. Same vocabulary, both layers.

### 5b. The reaction contract — components write themselves, templates react (July 2026, FINAL)

> Think **Redux**: ONE store; a component dispatches only to **its own slice**;
> templates are **pure views with selectors** over that store. Every write goes one
> direction — a component writes itself; everything else only reads.

**Component state is the single driver.** A component's state lives in its slice
(`chatId:nodeId`) and changes exactly two ways — both the same write:

- **Arrival**: the component streams in with its state already set (e.g.
  `defaultState: "focused"` in its initial data).
- **Interaction**: the user clicks it into a state (`setValue { defaultState: "focused" }`),
  now or ten turns later — the selector doesn't care when a component arrived, only
  what state it's in.

**Templates react via selectors — never by type, never by id.** A template surface
declares *what state it reacts to*:

```jsonc
{ "type": "ComponentSlot",
  "select": { "where": { "field": "defaultState", "eq": "focused" }, "limit": 1 } }
```

- Component enters a state the template has a surface for → the surface renders it.
- State the template doesn't know → no selector matches → **nothing happens; the
  component stays inline.** No error, no registry of valid states.
- "Which component?" is **intrinsic** — the one that changed state is the one selected.
- **Conflicts: most recent wins** (`limit: 1`, recency-ordered) — plain last-writer-wins.
- **One instance → one placeholder.** Every view has a placeholder: the conversation
  **flow** is the placeholder for `inline`; a **reaction surface** is the placeholder for
  a named view. While a component's view matches a surface, it renders **there** — the SDK
  *lifts it out of the flow* into the surface, so the same instance never paints in two
  places (a surface beside the flow does not double-render — authors never hide a flow
  copy with `hideBelow` or a covering overlay). A view no surface claims stays in the flow
  (the fallback). Its data lives in the conversation history throughout. **Close = the
  component sets its own view back** (its expanded face includes its own ✕; template chrome
  never writes a component's slice) → the surface releases it → it's back in the flow.
  *(SDK: the timeline renders only the turn's un-claimed instances — `template.tsx`
  `collectSurfacedViews` + the per-turn `shown` filter.)*
- **State is local; the view is the interface.** A component's internal state (`step`,
  `phase`) is private. Only the **view** (`defaultState`) crosses to the template — a
  surface selects on `defaultState`, never on an internal key (lint-enforced).
- **Many instances are fine** — the one-placeholder rule is *per instance*. A source may
  stream many cards; the **template owns how a placeholder lays them out** (a flow list, a
  single focus via `limit: 1`, a rail/grid) via its `select`.

**Template-focus is DERIVED, not stored** (same principle as `lifecycle`, §3): "am I
in focus mode?" = "does any component match my focus selector?". Template state remains
only for things that are genuinely the template's own (its panels, its draft).

**Most components are flat — one state (inline).** States are never required; a simple
card or chart just is its inline rendering. Studio shows every component's states as
standard (a flat component shows its single "Inline" chip; a stateful one shows a
clickable chip per state) — visibility is universal, multiplicity is earned. Component
states are **private**: designed and stepped in Studio, managed by the component at
runtime, read by nobody except a template selector matching on them.

**Components are contained microapps — light, self-contained, state-driven.** All
static content is hardcoded in the def; internal state + initial values live in the
def's **`state` block** (never props); **`props` remain only for the rare
`input: true` workflow feed** — a contained microapp has an empty props block.

**The two MASTER states — `inline` / `focused` — pick the face.** Every component has
two master faces (`layouts/inline` + `layouts/focused` — the layout FILENAME is the state name; a custom state gets `layouts/<name>`), and the root picks between
them with a `Switch on defaultState` (`focused` → full; `inline` and the default case
→ compact — inline is the universal default). The face is a **state decision, not a
width decision**: the same `defaultState` write that makes a template's focus selector
match also flips the component to its full face — one key drives both. Container
queries (`hideBelow`/`hideAbove`) remain for fine responsive adjustments *inside* a
face (e.g. hiding a side image when narrow), never for picking the face. The master
states are universal chrome (Studio shows them apart from the component's own states);
a component's *own* states (`states/`, ordered by `stateOrder`) are its private steps.
Full discipline: [`UNOVERSE_AUTHORING.md`](./UNOVERSE_AUTHORING.md) §3; enforced by
`server/src/runtime/microapp-structure.test.ts`.

**The two global rules — the only protocol-level behavior:**

1. **`template` swaps the shell.** The one reserved name: `resources/read` the named
   template, re-render the whole surface. Safe because the template owns nothing
   (§2e-0 of the spec) — conversation, components, and data stay in the store; the new
   template reacts to the same component states through *its own* selectors.
2. **Inline is the universal default.** No state, or a state this template has no
   selector for → the component renders inline. Always, always, always.

**This SUPERSEDES the earlier bridge mechanics** (deletions, to sweep as templates
migrate): the component→template `then: setTemplateValue { defaultState: "focus" }`
chain; the universal component node's `TEMPLATE_DATA { defaultState: "focus" }` emit-on-publish; and
type-pinned focus slots (`select: { type: ["SomeWidget"] }` — a template naming a
component type was always the violation). SDK addition required:
`ComponentSlot.select.where` (match components by state field/value — generic, no
feature names in core). Status: to build.

> **Authoring discipline:** since state names are open, keep them consistent per org —
> `focused` in one component and `focus` in another silently fragments the vocabulary
> templates select on. Convention, not protocol.

---

## 6. Persistence — ephemeral client state

All three buckets live in the **client's in-memory store** (`ComponentStore`). They are
**not** written to Redis. The state is **rebuilt from the stream** — reload the page and
the store starts empty and refills as the workflow re-emits.

- The **server** keeps the **agent's conversation memory** in Redis/DB — a *different
  layer* from this client render state. Do not conflate them.
- **Resumability** (survive a reload/reconnect without re-running the workflow) is a
  **future item**, not built. Today the client re-hydrates only from whatever is still in
  its in-memory store.

| State | Where | Persisted? |
|---|---|---|
| SDUI render state (the three buckets here) | client, in-memory `ComponentStore` | ❌ ephemeral, rebuilt from the stream |
| Agent / conversation memory (the workflow's record) | server, Redis/DB | ✅ yes |

---

## 6a. Size & eviction

The store is in-memory and only grows during a session (reload clears it, §6). The
growth vectors are the **timeline** (one entry per turn), the **component data map** (one
slice per component ever emitted), and the **voice transcript**. Template state does
*not* grow — it is replace/merge, O(1).

**The rule: hold at most the last `N` turns (default `N = 100`).** When a new turn pushes
the timeline over `N`:

1. **Drop the oldest turn(s)** until back at `N`.
2. **Delete the component slices those turns pointed at** (both the `data` and `types`
   entries) — the timeline holds pointers, so evicting a turn must free its data or the
   map leaks.

Principles (keep it un-clever):
- **One number, oldest-out-first.** No LRU, no priorities.
- **`N` is configurable; the default (100) is generous** — invisible in normal chats, a
  backstop for runaway sessions only.
- Keep **template state strictly replace/merge** (never append), so it stays O(1).
- Cap or window the **transcript** the same way (it rides the conversation, so turn
  eviction covers it).

**Why this is safe:** client state is ephemeral and the **server holds the real
conversation memory** (§6). The client only needs recent history for the UI; older
messages, if ever needed again, come from the server (the future resumability item) —
never from holding everything in the browser. The only trade-off: scrolling back past
`N` won't show evicted turns until resumability fetches them — a non-issue at `N = 100`.

---

## 7. The model in one picture

```
                        ┌─────────────────────────────────────────────┐
   the stream  ───────► │  CONVERSATION   timeline · turn status ·     │
   voice svc (script) ► │                 transcript                   │
                        ├─────────────────────────────────────────────┤
   COMPONENT_DATA  ───► │  COMPONENT STATE   per component id:         │
   setValue (local) ──► │                    data + own view state     │
                        ├─────────────────────────────────────────────┤
   workflow         ──► │  TEMPLATE STATE   draft · the dev's keys:    │
   setTemplateValue ──► │                   openPanel · suggestions ·  │
   voice svc (call) ──► │                   mode · voice state         │
                        └─────────────────────────────────────────────┘
        services (voice I/O) sit OUTSIDE — native, can't be data —
        but write their STATE into the buckets above, like any producer.
```

---

## 8. SDK alignment — status

**Done (the SDK hardcodes NO UI concept — only the two generic writes):**
- ✅ **Exactly two write actions:** `setValue` (component slice) + `setTemplateValue`
  (template state). The named UI verbs `togglePanel`/`closePanel`/`openFocus`/`closeFocus`
  were **removed** from `core`. The dev picks the key and the bucket.
- ✅ **Suggestions de-leaked.** No `suggestions` slice, no `SUGGESTIONS_UPDATE` case — one
  generic `TEMPLATE_DATA → mergeTemplateState`; faq-shape normalization lives in the node.
- ✅ **Focus is no longer a concept.** A widget's focused/inline look is its own
  `defaultState` (`setValue`); a screen-wide flag is a dev-named `setTemplateValue` key. The
  store no longer holds `focusedId`; the renderer no longer derives `defaultState`.
- ✅ **Voice removed from the store** — native service; its call state is a producer write.
- ✅ **100-turn eviction** — `maxTurns` frees evicted components' data.
- ✅ **Suggestions node emits generic `TEMPLATE_DATA`** (was `SUGGESTIONS_UPDATE`); the
  runtime's `send()` now pushes **only to the MCP `/stream`** (the local, run-scoped lane —
  `executionContext.ts` → `pushToClient`). The legacy WS lane carries **audio + global
  cross-MCP state**, not per-app component/template data (two-lane split — see
  `UNOVERSE_MCP_TEMPLATE_PROTOCOL.md` §5b).
- ✅ **Defs migrated** — `suggestions.json` (panel → `setTemplateValue openPanel`), and the
  focusable widgets + `close-button` (focus → `setValue defaultState`).
- ✅ **Guard tests** freeze it (`core/test/state-model.test.mjs`): the source scan now fails
  the build on `faq/suggestion/voice` **and** any `togglePanel/openFocus/…` verb in `core`.

**Remaining:**
1. **Voice call state still via a props side-channel** — the channel spreads `voice.state`
   into the template's `props`. Target: the producer writes it via `setTemplateValue` /
   `mergeTemplateState` (one uniform path). **Blocked on publishing** — the workbench builds
   against the *published* SDK, which has no `mergeTemplateState` yet.
2. **Propagate + the legacy break** — publish `core` + `react` (bumped), reinstall at the
   unoverse root, restart Vite, then verify focus + FAQ disclosure in the workbench.
   ⚠️ Publishing flips a **migration break live**: the Suggestions node now emits
   `TEMPLATE_DATA`, so any **legacy `SUGGESTIONS_UPDATE` consumer** (e.g. the old
   gravity-client suggestions UI) stops receiving it. Confirm that's acceptable / migrate it.

---

## 9. The as-built SDK surface (maps the model → the code)

The model above is implemented in the **published SDK** (`@unoverse-platform/unoverse-core`
+ `-react`, dev'd in the sibling `unoverse` repo). Concretely:

### `ComponentStore` (`core/src/store.ts`) — the single state

| Model bucket | Store API |
|---|---|
| **Conversation** | `addUserMessage` · `startResponse` · `completeResponse` · `getTimeline` / `getResponses` / `latestResponse` (turns hold pointers) |
| **Component state** | `apply({COMPONENT_INIT\|COMPONENT_DATA})` (merge at `chatId:nodeId`) · `get(chatId,nodeId)` · `getType` |
| **Template state** | `getTemplateState` / `mergeTemplateState` (generic) — plus `getDraft`/`setDraft` (the shared composer buffer, the one named convenience) |
| **Lifecycle** (derived) | `getLifecycle`/`setLifecycle` |
| **Reactivity / size** | `subscribe`/`getVersion` (React: `useSyncExternalStore`) · `new ComponentStore({maxTurns=100})` + internal `evict()` |

No `suggestions`/`faq`/`voice`/`openPanel`/`focus` member exists — those are just keys
callers write via the two actions and read via `visibleWhen`.

### Inbound wire messages (`core/src/connection.ts` → `applyServerMessage`)

| Message | Effect | Generic? |
|---|---|---|
| `COMPONENT_INIT` | place pointer + seed data (or, if a template directive, `setActiveTemplate`) | ✅ |
| `COMPONENT_DATA` / `OBJECT_DATA` | merge at `chatId:nodeId` | ✅ |

**Turn identity (model semantic — every port implements this):** `conversationId` names
the CONVERSATION (session addressing, elicitation, agent memory); `chatId` names ONE
TURN — it is the store's response identity, and every component keys `chatId:nodeId`.
The channel MINTS a fresh `chatId` per outbound send (`<conversationId>:t…`; the prefix
keeps conversation-scoped waiter resolution matching turn-scoped node waiters). One id
is shared by the user message, the assistant response, and the workflow run it fires —
so each exchange is its own turn, and re-running an app yields a NEW component instance
instead of merging into the previous one.

**Turn-internal ordering (model semantic — every port implements this):** a turn's
components order by **latest server activity, newest last**. `COMPONENT_INIT` places the
pointer at the end; a `COMPONENT_DATA` merge for a component that has since been
*overtaken* (something placed after it) moves its pointer back to the end of its turn.
This keeps the conversation reading naturally — e.g. streaming answer text that resumes
*after* the workflow placed an interactive component reorders below it. Cost discipline:
at most one structure change per overtake; the streaming hot path (component already
last) stays a data-only merge and never re-walks the template.
| `WORKFLOW_STATE` | open/complete the turn + `lifecycle` + template selection | ✅ |
| **`TEMPLATE_DATA`** | `mergeTemplateState(msg.data)` — the template-state twin of `COMPONENT_DATA` | ✅ |
| `SESSION_READY` | stream-live signal (handled by the connection hook) | ✅ |

No feature-named message remains. The producer names the keys (the Suggestions node sends
`TEMPLATE_DATA { data: { faqs, … } }`).

**Which lane:** every message in this table is **run-scoped** and arrives on the MCP
`/stream` — `applyServerMessage` reads the local lane. The SDK WS lane carries only **audio +
global cross-MCP state**, which is not a `ServerMessage` here (two-lane split,
`UNOVERSE_MCP_TEMPLATE_PROTOCOL.md` §5b).

### Action verbs (`core/src/actions.ts` → `dispatchAction`)

Exactly two writes + a server route: `setValue` / `input` → the **component's own slice**;
`setTemplateValue` → **template state**; any other type → the **server, as a native MCP call**. No UI
verbs, no feature names. (Leaf components dispatch via `actions.ts`; template chrome routes
`setTemplateValue` via `template.tsx`'s `dispatch` — same two-write vocabulary.)

**The server route is native MCP, owned by the SDK — not re-implemented per host** (`UNOVERSE_MCP_TEMPLATE_PROTOCOL.md` §0.3, *One SDK · one interaction path*):

- **Send a message** → `tools/call` on the app's trigger tool. Fire-and-forget: **the result comes back over the component stream, not the call — so no elicitation.**
- **Submit answers to a waiting app** → native `elicitation`, resolving the **held** `tools/call` (a model is waiting on it, §3.3).
- **Typing** is not a server route at all — `input` writes the local `draft`.

No bespoke REST, no custom `user_action` message. A host that hand-writes this routing is a bug (that drift is what broke the composer) — every consumer (workbench, native app, external MCP client) shares this one SDK path.

### Rendering (`react/`)

- `StreamedUnoverseComponent` (`streamed.tsx`) — renders one component from its merged slice
  data. No focus/`defaultState` injection — `defaultState` is just a data field the def
  wrote via `setValue`.
- `StreamedUnoverseTemplate` (`template.tsx`) — root scope = `...getTemplateState()` +
  conversation-derived flags (`isEmpty`/`isStreaming`/…); routes `setTemplateValue`.
- `useVoiceService` (`voice.tsx`) — the native voice **service** (WS audio lane); its call
  state is a producer that flows into template state (see §4 / §8 #1).

---

## Sources

- [Server-Driven UI: 2026 Guide to Architecture](https://www.weweb.io/blog/server-driven-ui-guide-architecture-examples)
- [Zero-Release Mobile Architecture — the 4 SDUI levels](https://medium.com/digia-studio/zero-release-mobile-architecture-the-path-every-server-driven-ui-takes-64c4b75b8b05)
- [Apollo — Server-Driven UI basics](https://www.apollographql.com/docs/graphos/schema-design/guides/sdui/basics)
- [Frontend Architecture of a Voice Agent Interface](https://ujjwaltiwari2.medium.com/frontend-architecture-of-a-voice-agent-interface-6236bfc393ba)
- [Projections & Read Models in event-driven architecture](https://event-driven.io/en/projections_and_read_models_in_event_driven_architecture/)
