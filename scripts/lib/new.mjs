#!/usr/bin/env node
/**
 * unoverse new — scaffold a new org.
 *
 *   node new.mjs org <name> [rx-root]
 *
 * Creates rx/orgs/<name>/ with the full org structure:
 *   components/   the org's own components
 *   templates/    the org's apps
 *   styles/       a complete copy of the default token set (base + semantic +
 *                 themes) — self-contained and theme-contract-complete, ready
 *                 to be rebranded.
 *
 * Components and templates are authored (by hand, in Studio, or with the
 * unoverse-create skill) — there is no scaffold command for them.
 */
import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, relative } from "node:path";

const [kind, ...rest] = process.argv.slice(2);
const usage = () => {
  console.error("Usage:\n  unoverse new org <name>");
  process.exit(2);
};
if (kind !== "org") usage();

const name = rest[0] || usage();
const rootArg = rest[1];
const RX = [rootArg && resolve(rootArg), resolve("apps/unoverse/rx"), resolve("rx")]
  .filter(Boolean)
  .find((p) => existsSync(p));
if (!RX) { console.error("Cannot find an rx/ folder — run from the repo root."); process.exit(2); }

const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, "");
if (!slug) usage();
if (slug === "default") { console.error("'default' is the platform token set, not a client org."); process.exit(1); }

const dir = join(RX, "orgs", slug);
if (existsSync(dir)) { console.error(`rx/orgs/${slug} already exists`); process.exit(1); }

const defaultStyles = join(RX, "orgs", "default", "styles");
if (!existsSync(defaultStyles)) {
  console.error("rx/orgs/default/styles not found — cannot seed the org's token set.");
  process.exit(1);
}

const rel = (p) => relative(process.cwd(), p);

mkdirSync(join(dir, "components"), { recursive: true });
mkdirSync(join(dir, "templates"), { recursive: true });
cpSync(defaultStyles, join(dir, "styles"), { recursive: true });

writeFileSync(
  join(dir, "README.md"),
  `# ${slug}

This org's own world on the platform:

| Folder | What lives here |
| --- | --- |
| \`components/\` | The org's own components — one folder per component |
| \`templates/\` | The org's apps — one folder per app (+ \`manifest.json\`) |
| \`styles/\` | The org's complete token set: \`base/\` + \`semantic/\` + \`themes/\` |

The styles are a full copy of the default token set, self-contained and ready to
rebrand. Keep every token NAME the default set defines (the theme contract checks
this); change the VALUES freely.
`,
);

console.log(`Created org '${slug}':`);
console.log("  " + rel(join(dir, "components")) + "/");
console.log("  " + rel(join(dir, "templates")) + "/");
console.log("  " + rel(join(dir, "styles")) + "/   (default token set, ready to rebrand)");
console.log("");
console.log("Next: author components in Studio or with the unoverse-create skill,");
console.log("then run 'unoverse lint' to check your definitions.");
