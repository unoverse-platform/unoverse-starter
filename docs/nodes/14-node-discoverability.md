---
sidebarTitle: "Node Discoverability"
title: "Node Discoverability"
---

> **This is critical, not cosmetic.** A node that works perfectly but never gets *selected* by the workflow-building agent (UNO / Universe Copilot) is dead code. Discoverability is decided entirely by three string fields on the node definition — `name`, `description`, `whenToUse` — and the `category`. Getting them wrong silently buries a specialized node under a generic one. This doc is the authoritative guide for those fields; `whenToUse` in particular.

> **This contract is NOT nodes-only.** Templates (MCP apps) and agent skills are embedded into **Spatial** and selected by *user intent* (`findIntent`) with the **same fields and the same formula** — every rule in this doc applies to them verbatim. See the final section, "Templates and skills use this contract too."

---

## How selection actually works (read this first)

When UNO builds a workflow it does **not** see the full node list. For each step it calls `getNodeCatalog({ task })`, where `task` is a one-line description of what that step must do (e.g. `"write a long-form GTM plan document"`). The catalog (`apps/unoverse/engine/src/nodes/unoverse/UnoverseMCP/services/CatalogService.ts`) then:

1. Filters to **active** packages only (intersected with the live Redis `nodes:types` set).
2. For every node, builds this exact text and embeds it:
   ```
   `${name}. ${whenToUse || description} [${category}]`
   ```
3. Ranks by **`0.8 × embedding-cosine + 0.2 × lexical-overlap`** against the `task` query.
4. Returns only the **top N** (default 12) by relevance. Everything below the cut is invisible to the agent for that step.

**Three consequences that drive everything below:**

- **`whenToUse` is the selection text** — when present it *replaces* `description` in the embedded string. It is not a footnote; it is the thing being ranked.
- **The opening words dominate the embedding.** A node whose `whenToUse` starts with plumbing vocabulary ("Hybrid MCP node: attach via a service edge…") is embedded near *wiring* concepts, not near the *job* a task query describes. It ranks low and falls below the top-N cut.
- **`whenToUse` decides whether the node SURFACES AT ALL, not just which sibling wins.** The old mental model — "guidance to pick between similar nodes once they're both on screen" — is wrong. If your node doesn't make the top-N for its job's task query, the agent never even considers it.

---

## The mental model: write for the task query, not for a human reader

Before writing a word, do this:

> **Imagine the one-line `task` a planner would type for the job your node does.** Write that sentence down. Those nouns and verbs are what your `name` + `whenToUse` must semantically match.

Example — for SmartDocument the planner's task is some variant of:
`"write / author / produce a long report / plan / spec / article that the agent revises"`

The key tokens are **write, author, produce, report, plan, spec, article, long, revise, document**. The node's `whenToUse` must contain those, *up front*. (The old meta led with "Hybrid MCP node: attach via a service edge…" — zero of those tokens in the opening. It lost every time to MarkdownRenderer, whose description is saturated with "document, report, summaries, long-form.")

---

## The formula

A good `description` / `whenToUse` is three layers, **in this order**:

1. **Outcome first.** Lead with the job-to-be-done, in the vocabulary a task query uses — the *outcome a user wants*, not the *mechanism you built*. ("Produce a long-form deliverable — report, plan, spec, article…")
2. **When to disqualify yourself — by *property*, not by naming a rival.** Say *why* your node fits or doesn't, as a property of the work ("writes and revises section by section; a one-shot generation can't be revised and blows the context window"). The property *is* the switch reason — the catalog ranking surfaces the alternative, so you never name it. Governing law: `docs/unoverseCopilot/LOGIC_PLACEMENT.md` Rule 3.
3. **The one wiring fact** that makes it work once picked. ("Attach via a service edge to an agent node.") Keep it **generic** — name the *consumer kind* ("an agent node"), not specific node types, which go stale. **The one exception (to both 2 and 3): an absolute structural must** — a hard companion/wiring dependency — names that node (e.g. SmartDocument's markdown *must* route to a MarkdownRenderer to display).

Mechanism comes **last**, never first. It's necessary for correct wiring but fatal for ranking when it leads.

### Rule: disqualify yourself by *property* — don't name the rival

> Governing law: `docs/unoverseCopilot/LOGIC_PLACEMENT.md` Rule 3 ("self-referential by default; name a companion only for an absolute must"). Naming the node you'd lose to over-indexes on an instance that **dates** the moment a sibling is added/renamed and breeds an N² web of cross-references — the §2 cardinal sin. Describe the **property** of your own job instead; the ranking does the surfacing.

You still must **know** the node that wins your job today — but to sharpen the *property* that beats it, not to name it in the text. The default one-shot/generic path is usually a *different category* of node:

| Your specialized node | The incumbent it loses to *(author's reasoning)* | The **property** to lead with *(the shipped text — names nobody)* |
| --- | --- | --- |
| SmartDocument | a one-shot dump into MarkdownRenderer | "writes & revises **section by section**; stateful, re-renders each edit" |
| AirtableExists | AirtableFetch + check in code | "a cheap **existence test** — branch on `exists`, no row fetched" |
| OpenAIStream | OpenAI (one-shot) | "**streams tokens** as they generate; also for bounded tool use" |

Lead with your job's outcome vocabulary (so you surface) and state your distinguishing property (so the agent switches). The middle column is *your* mental model — never the shipped text. **Name a node only for an absolute structural must** — a hard companion/wiring dependency (e.g. SmartDocument's rendered markdown *must* route to a MarkdownRenderer to display).

---

## Service-provider / MCP nodes (the tension that bit SmartDocument)

Service nodes (`isService: true`, often `inputs: []`) have a real conflict:

- They genuinely **must** tell the agent the wiring fact: *attach via a service edge to a consumer; not part of the data flow.* Skip it and the agent wires it as a pipeline step and it fails.
- But that wiring fact is **pure plumbing vocabulary** — and if it's the *opening*, the node ranks near wiring concepts and never surfaces for its actual job.

**Resolution: outcome first, wiring fact last.** Do not open with "Attach via a service edge." Open with the deliverable/job, state your disqualifying *property* (naming no rival), *then* close with the service-edge fact.

```typescript
// ❌ Old — plumbing first, loses the ranking, names only same-category siblings
whenToUse: "Hybrid MCP node: attach via a service edge to an agent that iteratively builds or edits a long markdown doc; every edit emits the rendered markdown downstream. For a visual board use MiroBridge; for one-shot PDF output use PdfRender.",

// ✅ New — outcome first, self-disqualify by PROPERTY (no rival named), companion + wiring fact last
whenToUse: "Pick whenever an agent must author or revise a long document — report, plan, spec, article, brief. Writes and revises section by section and live-renders each edit; a one-shot generation can't be revised and blows the context window on every change. Attach via a service edge to an agent node, and route its markdown to a MarkdownRenderer to display.",
```

This supersedes the old "always lead with *attach via a service edge*" guidance. Provider nodes still **must include** the service-edge fact — they just must not **open** with it.

---

## `category` is embedded too

`category` is appended as `[category]` to the ranked string, so it nudges the node's position in embedding space. Pick the category that matches the **job**, not the implementation. SmartDocument produces a deliverable → `Documents`, not `Agent Tools` (which pulled it toward tool-plumbing space). Also keep the node-definition `category` consistent with the `gravity.nodes[].category` in `package.json` — they drifted apart on SmartDocument (`Agent Tools` vs `Output`) and the definition is what the catalog reads.

**The taxonomy is descriptive, not generic** (replaces the old canonical 5 of `AI | Ingest | Storage | Output | Flow`). A descriptive category that names the *domain of the job* both groups the node well in the sidebar **and** ranks better, because the `[category]` token then sits near the task query's own vocabulary (`Go To Market` is closer to "find companies / enrich leads" than `Ingest` ever was). Current set: **AI · Voice · Go To Market · Search · Web Scraping · Media & Design · Documents · Knowledge & Vectors · Storage & Data · Communication · Flow · Output** (display components stay `Design System`). Add a new descriptive bucket when a node's job genuinely doesn't fit one — don't force-fit into a generic catch-all.

---

## Anti-patterns

- **Leading with mechanism.** "Hybrid MCP node…", "Callback node that…", "Attach via a service edge…" as the *first* words. Correct vocabulary, wrong position — it sinks the ranking.
- **Naming rival nodes in the text at all.** Over-indexes on instances that date and tangle (`LOGIC_PLACEMENT` §2). State the distinguishing *property* of your own job; let ranking surface the alternative. (Name a node only for an absolute structural must — a companion/wiring dependency.)
- **Restating the description.** "Use this node to call the OpenAI API." Zero selection signal.
- **Marketing fluff.** "A powerful, flexible node for all your needs."
- **Implementation detail.** "Calls GET /v2/companies/enrich with retry and backoff." The agent selects on the job, not the endpoint.
- **Category that describes the build, not the job.** `Agent Tools` for a node whose output is a document.

---

## Self-test before you ship a node

1. Write the one-line `task` a planner would type for this node's job. Do its key nouns/verbs appear in the **first sentence** of your `whenToUse`? If not, rewrite the opening.
2. Which node wins this job **today** if yours didn't exist? Did you sharpen the *property* that beats it — **without naming it** (name a node only for an absolute structural must)?
3. If `isService: true`: is the outcome first and the service-edge fact last (present, but not opening)?
4. Does `category` match the job, and agree with `package.json` → `gravity.nodes[].category`?
5. Is every claim grounded in the code, not in what the node sounds like it does?

> Marketplace nodes are ranked off the **live registry** (Redis-registered package nodes). Editing the source isn't enough — rebuild, republish, and let unoverse reconcile before the new meta affects selection.

---

## Templates and skills use this contract too

Nodes are selected by a *planner's task query*; **templates (MCP apps) and agent skills are selected by the USER'S OWN INTENT** — the **Spatial** engine (`findIntent`) ranks them against what the user literally asks for ("transfer money to Kieran", "I want to complain"). Same fields, same formula, higher stakes: mechanism-first meta makes an entire app invisible.

**Where the fields live:**

| Artifact | Meta lives in | Embedded discovery text |
| --- | --- | --- |
| Node | node definition (`node/index.ts`) | `` `${name}. ${whenToUse \|\| description} [${category}]` `` |
| Template / MCP app | `manifest.json` in the template folder | `` `${title}. ${whenToUse \|\| description} [${category}]` `` |
| Agent skill | `SKILL.md` frontmatter | `name + whenToUse + description + instructions` (full text) |

**One job per field — never blend them:**

- `name` — human display name ("Bank Transfer").
- `description` — what it **is** (shows in listings). No "use when…" inside it, and **one short line (≤ 120 chars)** — it's the listing subtitle, not a spec; detail belongs in `whenToUse`/instructions.
- `whenToUse` — the **selection text**. For templates/skills, write it in the **end user's vocabulary**, not a developer's: lead with what the user would say ("Transfer or send money — pay a beneficiary or move funds…"), never with the layout or mechanism ("Two-column split: streamed text + card on the left…" ranks near *layout* concepts and loses every intent query).

**Utterance-shaped, never selector-shaped.** Nodes are picked by a planner, so "Pick when a step needs X" works there. Templates/skills are ranked against the user's OWN message — so phrases like "Pick when the user asks to…" are dev-framing that dilutes the embedding with words no user ever types. Write the words the user would actually say:

```jsonc
// ❌ selector-shaped (instructions to an agent about "the user")
"whenToUse": "Pick when the user asks to talk, use voice, or wants a phone-style assistant."

// ✅ utterance-shaped (the user's own vocabulary)
"whenToUse": "Talk to the assistant by voice — a live, hands-free audio call instead of typing."
```

Watch for **cross-artifact collisions** too: a voice surface claiming "asks to talk / speak" poaches *human-agent* intents ("speak to someone" belongs to live support / complaints). Own the modality or the job — cede the neighbor by property.
- `category` — the domain of the job (Payments, Cards, Assistant, …).

**The generalist trap (chat homes / assistant surfaces).** A default/fallback surface must NOT enumerate its siblings' jobs ("ask about cards, transfers, …") — that vocabulary makes it outrank the focused apps for *their* intent queries. A fallback owns *general help, questions, reaching a person*, and cedes specific jobs by property, naming none:

```jsonc
// ❌ poaches the focused apps' queries
"whenToUse": "Chat with the assistant — ask about accounts, cards, transfers or any banking question."

// ✅ owns the fallback, cedes by property
"whenToUse": "Ask a banking question or get general help from customer support — including reaching a live agent. The conversational home and fallback: specific jobs like moving money or choosing a product have their own focused apps; everything else starts here."
```

**Registry meta embeds AS-IS** — no LLM rewrite ("convert-to-need") for templates or skills; what you author is exactly what ranks. Editing `whenToUse` changes the content hash, so the item re-embeds on the next train. The reconcile warns for any enabled template missing `whenToUse`.

Authoring homes for the details: `docs/unoverse/UNOVERSE_AUTHORING.md` §8 (templates) and the `unoverse-create` skill's `references/template.md` / `references/agent-skill.md`.
