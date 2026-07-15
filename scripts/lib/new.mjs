#!/usr/bin/env node
/**
 * unoverse new — scaffold a conformant rx/ artifact.
 *
 *   node new.mjs component <name> [rx-root]
 *   node new.mjs template <org> <name> [rx-root]
 *
 * Emits a definition that passes `unoverse lint` as-is: full envelope, props
 * with defaults marked input:true (the defaults ARE the Studio mock), token-only
 * styles, and a manifest (templates). TODO markers show what to fill in.
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve, relative } from "node:path";

const [kind, ...rest] = process.argv.slice(2);
const usage = () => {
  console.error("Usage:\n  unoverse new component <name>\n  unoverse new template <org> <name>");
  process.exit(2);
};
if (!["component", "template"].includes(kind)) usage();

const name = (kind === "component" ? rest[0] : rest[1]) || usage();
const org = kind === "template" ? rest[0] || usage() : null;
const rootArg = kind === "component" ? rest[1] : rest[2];
const RX = [rootArg && resolve(rootArg), resolve("apps/unoverse/rx"), resolve("rx")]
  .filter(Boolean)
  .find((p) => existsSync(p));
if (!RX) { console.error("Cannot find an rx/ folder — run from the repo root."); process.exit(2); }

const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, "");
const pascal = slug.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const write = (path, obj) => {
  writeFileSync(path, JSON.stringify(obj, null, 2) + "\n");
  console.log("  created " + relative(process.cwd(), path));
};

if (kind === "component") {
  const dir = join(RX, "components", slug);
  if (existsSync(dir)) { console.error(`rx/components/${slug} already exists`); process.exit(1); }
  mkdirSync(dir, { recursive: true });

  write(join(dir, `${slug}.json`), {
    unoverse: "1.0",
    kind: "component",
    name: pascal,
    category: "General",
    description: `TODO: one line — what ${pascal} shows.`,
    whenToUse:
      "TODO: outcome-first, in the USER's vocabulary — what user need picks this component. " +
      "Disqualify by property ('not for lists/charts'), never by naming a sibling. (docs/design/05)",
    nodeSize: { width: 480, height: 320 },
    props: {
      _comment_props:
        "Every field the definition binds, each WITH a default (the Studio mock). input:true = fed by the workflow at runtime.",
      title: { type: "string", default: "Title", input: true },
      description: { type: "string", default: "A short supporting line.", input: true },
    },
    root: {
      type: "Box",
      style: {
        width: "full", direction: "column", gap: "3", padding: "lg",
        background: "surface.base", border: "subtle", shadow: "lg", overflow: "hidden",
      },
      children: [
        { type: "Text", bind: { value: "title" },
          style: { font: "headline.sm", weight: "semibold", color: "text.primary" } },
        { type: "Text", bind: { value: "description" }, visibleWhen: "description",
          style: { font: "body.md", color: "text.secondary" } },
      ],
    },
  });

  console.log(`
Next:
  1. Fill the TODOs (description + whenToUse — the AI picks by whenToUse).
  2. Add your real props (defaults + input:true) and compose the root from the closed set.
     Prop DEFAULTS are the mock data Studio renders. If the component has multiple layers
     (a Switch), enumerate them as states/<layer>.json — the folder IS Studio's state
     picker (docs/design/07).
  3. ./unoverse lint            # authoring-time checks
  4. ./unoverse gendesign       # regenerate the component node + restart
  5. Preview in Studio: mock (prop defaults + state picker), then live.   (docs/design/01)`);
} else {
  const dir = join(RX, "orgs", org, "templates", slug);
  if (!existsSync(join(RX, "orgs", org)))
    console.log(`  note: org "${org}" doesn't exist yet — copy rx/orgs/default/styles → rx/orgs/${org}/styles for its token set`);
  if (existsSync(dir)) { console.error(`rx/orgs/${org}/templates/${slug} already exists`); process.exit(1); }
  mkdirSync(join(dir, "layouts"), { recursive: true });
  mkdirSync(join(dir, "states"), { recursive: true });

  // manifest-only anatomy: the manifest IS the envelope; layouts/main.json is the root
  write(join(dir, "manifest.json"), {
    name: pascal,
    description: "TODO: one line — what this app IS (≤120 chars).",
    whenToUse:
      "TODO: utterance-shaped, the USER's words — what someone would say that should open this app. Disqualify by property, never by naming siblings.",
    category: "General",
    version: "1.0.0",
    defaultState: "template",
    inputSchema: {
      type: "object",
      properties: { message: { type: "string", description: "The user's request" } },
    },
    stateOrder: ["conversation"],
    binding: { workflow: "TODO-workflow-id", trigger: "TODO-trigger-node-id" },
    autoTrigger: false,
    layout: "main",
  });

  write(join(dir, "layouts", "main.json"), {
    type: "Box",
    style: { direction: "column", width: "full", height: "full" },
    children: [{ $include: "states/conversation" }],
  });

  write(join(dir, "states", "conversation.json"), {
    type: "Box",
    style: { direction: "column", flex: "1", minHeight: "0" },
    children: [
      { type: "ComponentSlot", select: {}, fallback: { type: "Skeleton", variant: "card" } },
    ],
  });

  console.log(`
Next:
  1. Fill the TODOs — especially binding.workflow + binding.trigger (the app OWNS its workflow).
  2. Build the surface in layouts/main.json + states/ (mirror rx/orgs/bpp/templates/bppchatlayout).
     Reaction surfaces select by STATE: where:{field:"defaultState",eq:"focused"} — never by type.
  3. ./unoverse lint, then ./unoverse gendesign, then preview in Studio.`);
}
