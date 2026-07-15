# 06 — Styles & Tokens

**LAW 1: definitions own ZERO style values. Token names only.**

The SDK renderer owns no styles either — it only *resolves* token names against the theme served live from the platform (`unoverse://theme/<name>` — an MCP resource, never baked into a bundle). A color change is a refresh, not a release.

---

## 🚫 The law

```jsonc
// ❌ NEVER — raw values in a definition
{ "style": { "padding": "12px", "color": "#4F46E5", "fontSize": "1.25rem" } }

// ✅ ALWAYS — token names
{ "style": { "padding": "4", "color": "text.primary", "font": "headline.sm" } }
```

- No `px` / `rem` / `em` / `#hex` anywhere under `rx/components/`, `rx/atoms/`, or `rx/orgs/**/templates/`. `./unoverse lint` scans for exactly this and fails ([08](./08-validate-and-ship.md)).
- Sizes use the **space scale** (`"width": "8"` = 2rem, Tailwind-style: step N = N × 0.25rem) — and only **real steps**: `0 1 1.5 2 3 4 5 6 7 8 10 12 16 20 24 28 40 50 75 90 100 120 140 160 180 200` (+ `full`/`auto`). An invented step (`"26"`, `"3.5"`) is NOT rounded — it falls through as broken CSS and the element silently reverts to auto sizing. `./unoverse lint` rejects off-scale values.
- ❌ No invented component-named tokens (`cardMin`, `wizardWidth`) — use the generic scale steps. If the scale genuinely lacks a step, extend the scale in `styles/`, don't smuggle a value into a definition.

## 🔒 Style KEYS are closed too — the cross-platform contract

It's not just values: the set of style **keys** (`padding`, `direction`, `radius`, `hover`, …) is a closed vocabulary — exactly the neutral intents the SDK style interpreter maps, and the contract every renderer (web today; iOS, Android, React Native, Flutter as they land) implements. An unknown key is ignored by **every** renderer, so it is always a typo (`colour`) or a web-ism that would never port (`backdropFilter`, `gridTemplateColumns`).

Both the schema (editor squiggle) and `./unoverse lint` (error) enforce the key set, including inside `hover`/`active` and `when[].apply`. If a design genuinely needs an intent the vocabulary lacks, that's a platform conversation (a new key every renderer must implement) — never a definition-side workaround.

**Why so strict:** brand and dark-mode swaps must touch `styles/` only. One raw hex in one definition breaks that guarantee for the whole org.

---

## 🗂️ The token layers

```
rx/orgs/<org>/styles/
├── base/        # raw scales — the only place raw values EXIST
│   ├── color.json        # palettes
│   ├── spacing.json      # the space scale (the closed step set — see LAW above)
│   ├── typography.json   # font scales
│   └── radius.json / shadow.json / border.json / motion.json
├── semantic/    # named meanings, built FROM base
│   ├── text-styles.json  # headline.lg, body.sm… (referenced via "font")
│   ├── fonts.json / spacing.json / icons.json
│   └── prose.json / skeleton.json / keyframes.json / root.json
└── themes/      # brand / dark-mode swaps
    ├── light.json
    └── dark.json
```

| Layer | Answers | Definitions may reference? |
|---|---|---|
| **base** | "what values exist" | ❌ never directly |
| **semantic** | "what things mean" (`text.primary`, `surface.base`, space steps) | ✅ this is your vocabulary |
| **themes** | "what this brand/mode maps them to" | ❌ selected at runtime, not referenced |

Definitions speak **semantic**. Themes remap semantic → base per brand or mode; a theme-contract guard keeps token names consistent so every theme satisfies every definition.

---

## 🏢 Org scoping

- **Atoms and components are universal** — they live at the `rx/` top level and are shared by every org.
- **Templates and styles are org-scoped** — `rx/orgs/<org>/`. Each org gets its own complete token set and templates. There are **no overlays and no per-org components**: if two orgs need different looks, that difference is 100% in their `styles/` (and, if truly structural, their templates).

Starting a new org: copy the neutral baseline and re-token it —

```bash
cp -r rx/orgs/default/styles rx/orgs/<org>/styles
```

(`rx/orgs/default` is the starter set kept for exactly this purpose; in the platform monorepo `npm run new-org -- <org>` does the same.)

---

## 📋 Styling checklist

- [ ] Zero raw values in any definition (linter enforces)
- [ ] Only **semantic** token names referenced (`text.primary`, not a palette entry)
- [ ] No component-named tokens invented
- [ ] New brand/mode = a new `themes/` file, zero definition edits
- [ ] Theme keeps the full token contract (guard test)

---

**Next:** [07 — Studio](./07-studio.md) — see it, test it, on every channel.
