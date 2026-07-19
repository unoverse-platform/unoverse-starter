# Client orgs (`rx/orgs/<org>/`)

One folder per client. The rule of the whole `rx/` layout, in one sentence:

> **Shared UI lives once at the top of `rx/`; everything belonging to a client — its
> apps and its brand — lives in its `rx/orgs/<client>/` folder.**

```
rx/
├── atoms/          UNIVERSAL — building blocks, one copy
├── components/     DESIGN SYSTEM — generic card, chart, media… one copy; the THEME carries the brand
└── orgs/
    ├── default/
    │   └── styles/      the DEFAULT token set — NOT a client: the starter `new-org`
    │                    copies, the components' preview theme, and the name contract
    └── <org>/
        ├── templates/   the client's APPS — one folder per app (+ manifest.json)
        ├── components/  the client's OWN MICROAPPS — org-private (their finder, their page);
        │                same anatomy as any component; names unique across ALL tiers
        └── styles/      the client's COMPLETE tokens: base + semantic + themes (light/dark)
```

## The two rules

1. **Design-system components and atoms are universal.** They reference token *names*
   (`action.primary`, `text.headline`, `space.4`) and never a client's values or
   content — so the same card renders SAB-red under `sab/light` and BPP-cobalt under
   `bpp/light`. Client content goes in the client's *template* (props/data), *theme*
   (values) — or its own **org components** (`<org>/components/`): the client's
   product microapps, org-private, never a restyle of a shared component.
2. **An org's styles are 100% its own.** `rx/orgs/<org>/styles` is complete and
   self-contained — palettes, typography (yes, different fonts per client), spacing,
   semantic layer, themes. Editing it cannot affect any other client. The only
   contract: it must define every token *name* the default set defines
   (`theme-contract.test.ts` fails the build if one goes missing; adding extras is
   always fine).

## Addressing

| Thing | Address |
|---|---|
| design-system component / atom | `unoverse://components/card` — no org, universal |
| org component | `unoverse://components/<org>/<name>` — org-private (bare refs also resolve: names are unique) |
| app | `unoverse://apps/sab/banktransfer` |
| template definition | `unoverse://templates/bpp/bppchatlayout` |
| theme | `unoverse://theme/bpp/light` (`theme/light` = the default set) |

Served templates and app manifests carry their `org` (injected from the folder,
never hand-written); the SDK uses it to fetch `<org>/light` automatically.

## New client

```
npm run new-org <name>
```

Creates `rx/orgs/<name>/` with an empty `templates/` and a complete copy of
`orgs/default/styles` to restyle. That's it — the filesystem is the registry; no
code change, no registration. Run `npm test` after restyling to verify the token
contract.
