#!/usr/bin/env node
/**
 * unoverse lint — the rx/ definition linter.
 *
 * Enforces the LOCKED anatomy (the CardFinder/JourneyFinder + bppchatlayout
 * exemplars) as a standalone authoring-time check (no deps). Errors fail
 * (exit 1); warnings and hints inform. Every message cites the owning doc.
 *
 * The anatomy it enforces:
 *
 *   COMPONENT  rx/components/<name>/
 *     <name>.json            envelope: unoverse/kind/name/category, nodeSize?,
 *                            outputs?, state:{}?, stateOrder:[]?, root (a Switch
 *                            on `defaultState` → layouts/compact | layouts/full)
 *     manifest.json          OPTIONAL — spatial discovery (title/description/
 *                            whenToUse/category/version). NO binding.
 *     layouts/*.json         the faces (compact = inline · full = focused)
 *     components/*.json      sub-partials ($include'd shapes)
 *     states/*.json          wizard-step layers (the Studio state picker)
 *
 *   TEMPLATE   rx/orgs/<org>/templates/<name>/
 *     manifest.json          THE ENVELOPE: name/description/whenToUse/category/
 *                            version/defaultState/inputSchema/stateOrder:[]/
 *                            binding{workflow,trigger}/layout · width?
 *     layouts/<layout>.json  the root tree (named by manifest.layout)
 *     components/*.json       sub-partials
 *     states/*.json           layers
 *
 * Content has THREE homes (§3 microapp discipline): hardcoded literals in the
 * def · the `state:{}` block (keys the def's own actions write) · `props` with
 * `input:true` (workflow-fed). A contained microapp has empty/absent props.
 *
 * Usage: node lint.mjs [path-to-rx]   (default: ./apps/unoverse/rx or ./rx)
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, dirname, basename, resolve, sep } from "node:path";

// ── ground truth (mirrors rx/_schema/unoverse.schema.json + server guards) ──
const PRIMITIVES = new Set([
  "Box", "Stack", "Row", "Column", "Each", "Switch", "ComponentSlot", "Timeline",
  "Text", "Image", "Button", "Input", "Markdown", "Skeleton", "Icon", "Ref",
]);
const CONDITION_KEYS = new Set(["field", "eq", "ne", "in"]);
// the portable style vocabulary — every key the SDK interpreter maps (sdk/style.ts).
// Each is a neutral intent every native renderer (iOS/Android/RN/Flutter) implements;
// an unknown key is a typo or a web-ism that renders nowhere.
const STYLE_KEYS = new Set([
  "width", "height", "maxWidth", "minWidth", "minHeight", "maxHeight", "flex",
  "padding", "margin", "gap", "overflow",
  "position", "inset", "top", "right", "bottom", "left", "zIndex",
  "direction", "wrap", "align", "justify", "display", "columns", "container", "hideBelow",
  "background", "radial", "border", "borderTop", "borderRight", "borderBottom", "borderLeft",
  "outline", "shadow", "radius", "radiusTopLeft", "radiusTopRight", "radiusBottomLeft", "radiusBottomRight",
  "font", "weight", "lineHeight", "color", "textAlign", "fit",
  "transform", "transition", "animation", "animationDelay", "cursor",
  "hover", "active", "when",
]);
// exact regex from server/src/runtime/definition-tokens.test.ts
const RAW_VALUE = /#[0-9a-fA-F]{3,8}\b|\b\d*\.?\d+(px|rem|em)\b/;
// nodes reachable through these keys (data keys like `items`/`cases` handled explicitly)
const CHILD_NODE_KEYS = ["children", "template", "fallback", "user", "assistant"];
// folders that hold BARE PARTIALS one level under the definition root
const PARTIAL_DIRS = new Set(["layouts", "states", "components", "blocks"]);

// ── find the rx root ──
const arg = process.argv[2];
const candidates = arg ? [resolve(arg)] : [resolve("apps/unoverse/rx"), resolve("rx")];
const RX = candidates.find((p) => existsSync(join(p, "components")) || existsSync(join(p, "atoms")));
if (!RX) {
  console.error("unoverse lint: cannot find an rx/ folder (looked for: " + candidates.join(", ") + ")");
  process.exit(2);
}

const problems = [];
const seen = new Set();
const report = (level, file, msg, line) => {
  const rel = relative(process.cwd(), file);
  const key = `${level}|${rel}|${line ?? ""}|${msg}`;
  if (seen.has(key)) return;
  seen.add(key);
  problems.push({ level, file: rel, line, msg });
};

// ── helpers ──
function jsonFiles(dir) {
  let out = [];
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    if (f.startsWith(".")) continue;
    const p = join(dir, f);
    if (statSync(p).isDirectory()) out = out.concat(jsonFiles(p));
    else if (f.endsWith(".json")) out.push(p);
  }
  return out;
}
const isFixture = (f) => f.endsWith(".states.json");
const isManifest = (f) => basename(f) === "manifest.json";
const isTemplatePath = (f) => f.includes(`${sep}templates${sep}`);
// The DEFINITION ROOT folder for a file: a bare partial lives one level under it
// (layouts/ states/ components/ blocks/); every `$include` resolves against it.
const defRoot = (file) => {
  const dir = dirname(file);
  return PARTIAL_DIRS.has(basename(dir)) ? dirname(dir) : dir;
};

// The space scale — a bare numeric dimension value MUST be a real step, or the
// renderer passes it through as broken CSS and the element auto-sizes silently.
const DIMENSION_KEYS = new Set([
  "width", "height", "maxWidth", "minWidth", "minHeight", "maxHeight",
  "gap", "padding", "margin", "top", "right", "bottom", "left", "inset",
]);
const spaceSteps = new Set(["0", "full", "auto"]);
{
  const orgs = existsSync(join(RX, "orgs")) ? readdirSync(join(RX, "orgs")) : [];
  for (const org of orgs) {
    const f = join(RX, "orgs", org, "styles", "base", "spacing.json");
    if (!existsSync(f)) continue;
    try {
      const space = JSON.parse(readFileSync(f, "utf8")).space ?? {};
      for (const k of Object.keys(space)) if (!k.startsWith("$")) spaceSteps.add(k);
    } catch { /* linted on its own */ }
  }
}
const stepList = () => [...spaceSteps].filter((s) => /^\d/.test(s)).sort((a, b) => Number(a) - Number(b)).join(", ");
const checkDimension = (file, where, key, v) => {
  for (const val of Array.isArray(v) ? v : [v]) {
    if (typeof val !== "string" || val.includes("{{")) continue;
    if (/^\d+(\.\d+)?$/.test(val) && spaceSteps.size > 3 && !spaceSteps.has(val))
      report("error", file, `${where}.${key}: "${val}" is not a step on the space scale — invalid values fall through as broken CSS (auto sizing). Real steps: ${stepList()} (docs/design/06)`);
  }
};

// atoms — case-insensitive by filename (the platform's lookup rule)
const atomsDirExists = existsSync(join(RX, "atoms"));
const atomNames = new Set(
  (atomsDirExists ? readdirSync(join(RX, "atoms")) : [])
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, "").toLowerCase()),
);

// definition homes: shared components/atoms + each org's templates (same law everywhere)
const homes = [{ dir: join(RX, "components") }, { dir: join(RX, "atoms") }];
const orgsDir = join(RX, "orgs");
if (existsSync(orgsDir))
  for (const org of readdirSync(orgsDir)) {
    const t = join(orgsDir, org, "templates");
    if (existsSync(t) && statSync(t).isDirectory()) homes.push({ dir: t });
  }

// ── condition (visibleWhen / style.when entry) ──
function checkCondition(vw, file, where) {
  if (typeof vw === "string") return; // bare truthy field
  if (vw && typeof vw === "object" && !Array.isArray(vw)) {
    if (typeof vw.field !== "string")
      report("error", file, `${where}: condition needs a "field" (docs/design/04)`);
    const extra = Object.keys(vw).filter((k) => !CONDITION_KEYS.has(k));
    if (extra.length)
      report("error", file, `${where}: illegal condition key(s) ${extra.join(", ")} — only eq/ne/in/truthy exist; no and/or/arithmetic (derive in the node) (docs/design/03)`);
    return;
  }
  report("error", file, `${where}: visibleWhen must be a field name or { field, eq|ne|in } (docs/design/04)`);
}

// ── per-node structural walk ──
// `widthCap` = the tightest numeric maxWidth on this node's ancestor chain (space
// steps are monotonic, so step names compare numerically).
function walkNode(node, file, root, widthCap = null) {
  if (Array.isArray(node)) return node.forEach((n) => walkNode(n, file, root, widthCap));
  if (!node || typeof node !== "object") return;

  // $include — resolves against the DEFINITION ROOT (layouts/ states/ components/…)
  if (typeof node.$include === "string") {
    const a = join(root, node.$include + ".json");
    const b = join(root, node.$include);
    if (!existsSync(a) && !existsSync(b))
      report("error", file, `$include "${node.$include}" does not resolve under ${relative(process.cwd(), root)}/ (docs/design/03)`);
    return; // the included file is linted on its own
  }

  const t = node.type;
  if (typeof t !== "string")
    report("error", file, `node without "type" (and no $include) — every node names a primitive (docs/design/02)`);
  else if (!PRIMITIVES.has(t))
    report("error", file, `unknown primitive "${t}" — the set is closed; compose, don't invent (docs/design/02)`);

  if (t === "Switch") {
    if (typeof node.on !== "string" || !node.cases || typeof node.cases !== "object")
      report("error", file, `Switch needs "on" (the discriminant field) + "cases" (docs/design/04)`);
    else
      for (const [caseKey, branch] of Object.entries(node.cases)) {
        const vw = branch && typeof branch === "object" ? branch.visibleWhen : undefined;
        const guarded = typeof vw === "string" ? vw : vw && typeof vw === "object" ? vw.field : null;
        if (guarded === node.on)
          report("error", file, `Switch on "${node.on}" → case "${caseKey}" re-guards its own discriminant — a layer never guards itself; delete the visibleWhen (docs/design/03)`);
      }
  }
  // Each: a `template` + a list — EITHER a literal `items:[]` (hardcoded content,
  // the microapp default) OR `bind.items` (a workflow-fed array).
  if (t === "Each") {
    const hasList = Array.isArray(node.items) || (node.bind && typeof node.bind === "object" && node.bind.items);
    if (!node.template || !hasList)
      report("error", file, `Each needs "template" + a list — literal "items": [...] or "bind": { "items": "<field>" } (docs/design/03)`);
  }
  if (t === "Ref") {
    if (typeof node.ref !== "string")
      report("error", file, `Ref needs "ref": "<atom name>" (docs/design/03)`);
    else if (atomsDirExists && !atomNames.has(node.ref.toLowerCase()))
      report("error", file, `Ref "${node.ref}" — no matching atom in rx/atoms/ (lookup is case-insensitive by filename)`);
  }
  if (t === "ComponentSlot") {
    if (!node.select || typeof node.select !== "object")
      report("error", file, `ComponentSlot needs "select" ({} for the conversation flow) (docs/design/05)`);
    else if (node.select.from === "all" && !node.select.type && !node.select.where)
      report("warn", file, `global ComponentSlot (from:"all") with no "type" and no "where" — selects OLDEST-first; a trap in a multi-turn surface. Filter by "where" (the reaction contract, §5b) or pin "type", unless the shell is deliberately catch-all (docs/design/05)`);
    // STATE-SELECTED UI (STATE_MODEL §5b): a reaction surface reacts to the component's
    // VIEW — the `defaultState` discriminant — never to a component's internal state
    // (step/phase/…) which is private to the component. Selecting on any other field
    // reaches past the view boundary the whole model rests on.
    else if (node.select.where && node.select.where.field && node.select.where.field !== "defaultState")
      report("warn", file, `reaction surface selects on "${node.select.where.field}" — a template reacts to a component's VIEW ("defaultState"), never its internal state (that is private to the component). Select on "defaultState" (STATE_MODEL §5b)`);
  }

  if (node.visibleWhen !== undefined) checkCondition(node.visibleWhen, file, t || "node");

  // deprecated FOCUS BRIDGE (STATE_MODEL §5b): nothing writes a template `defaultState`
  // key anymore — a component writes only its own slice; templates react via select.where.
  // (Legit panel/draft setTemplateValue writes a DIFFERENT key and is untouched.)
  const scanAction = (a) => {
    if (!a || typeof a !== "object") return;
    if (a.type === "setTemplateValue" && Array.isArray(a.values) && a.values.some((v) => v && v.key === "defaultState"))
      report("warn", file, `setTemplateValue writing "defaultState" is the deprecated focus bridge — a component writes only its own slice; templates react via ComponentSlot.select.where (STATE_MODEL §5b)`);
    if (a.then) scanAction(a.then);
  };
  if (node.action) scanAction(node.action);

  // style — closed KEY vocabulary + real space-scale VALUES (both cross-platform contracts)
  if (node.style && typeof node.style === "object") {
    // a container query the element's own layout can never satisfy — the threshold is
    // at/above an ancestor's maxWidth cap, so visibility is decided by the HOST surface,
    // not the design (shows in a wide studio stage, vanishes in a chat column)
    const mw = node.style.maxWidth;
    if (typeof mw === "string" && /^\d+$/.test(mw))
      widthCap = widthCap == null ? Number(mw) : Math.min(widthCap, Number(mw));
    const hb = node.style.hideBelow;
    if (typeof hb === "string" && /^\d+$/.test(hb) && widthCap != null && Number(hb) >= widthCap)
      report("warn", file, `hideBelow "${hb}" ≥ an ancestor maxWidth "${widthCap}" — the query can only be satisfied by the surrounding surface, so visibility depends on the host, not the card; lower the threshold below the card's own max width (docs/design/06)`);
    const checkKeys = (obj, where) => {
      for (const k of Object.keys(obj)) {
        if (k === "when") continue; // validated below
        if (!STYLE_KEYS.has(k))
          report("error", file, `${where}: unknown style key "${k}" — the style vocabulary is closed (the cross-platform contract). Typo, or a web-ism that won't port (docs/design/06)`);
        else if ((k === "hover" || k === "active") && obj[k] && typeof obj[k] === "object")
          checkKeys(obj[k], `${where}.${k}`);
        else if (DIMENSION_KEYS.has(k)) checkDimension(file, where, k, obj[k]);
      }
    };
    checkKeys(node.style, `${t}.style`);
    // style.when = [{ field, eq|ne|in?, apply:{…} }, …]
    if (node.style.when !== undefined) {
      const w = node.style.when;
      if (!Array.isArray(w))
        report("error", file, `${t}.style.when must be an array of { field, eq|ne|in, apply } entries (docs/design/04)`);
      else
        for (const e of w) {
          if (!e || typeof e !== "object" || typeof e.field !== "string" || !e.apply)
            report("error", file, `${t}.style.when entry needs "field" + "apply" (docs/design/04)`);
          else {
            const extra = Object.keys(e).filter((k) => !CONDITION_KEYS.has(k) && k !== "apply");
            if (extra.length)
              report("error", file, `${t}.style.when: illegal key(s) ${extra.join(", ")} — conditions are eq/ne/in/truthy only (docs/design/04)`);
            if (typeof e.apply === "object") checkKeys(e.apply, `${t}.style.when.apply`);
          }
        }
    }
  }

  for (const key of CHILD_NODE_KEYS) if (node[key] !== undefined) walkNode(node[key], file, root, widthCap);
  if (t === "Switch" && node.cases && typeof node.cases === "object")
    for (const branch of Object.values(node.cases)) walkNode(branch, file, root, widthCap);
}

// ── stateOrder ⇄ states/ folder cross-check ──
function checkStateOrder(order, rootFolder, file) {
  if (!Array.isArray(order)) return;
  const statesDir = join(rootFolder, "states");
  const onDisk = existsSync(statesDir)
    ? new Set(readdirSync(statesDir).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")))
    : new Set();
  for (const name of order)
    if (typeof name === "string" && !onDisk.has(name))
      report("error", file, `stateOrder lists "${name}" but states/${name}.json does not exist (docs/design/03)`);
  for (const name of onDisk)
    if (!order.includes(name))
      report("warn", file, `states/${name}.json is not in stateOrder — it falls to the end of the picker; add it to lock the order (docs/design/07)`);
}

// ── lint one file ──
function lintFile(file) {
  const src = readFileSync(file, "utf8");

  // LAW 1 — tokens only (skip manifest + fixture; styles/ is never in a def home)
  if (!isFixture(file) && !isManifest(file))
    src.split("\n").forEach((line, i) => {
      if (RAW_VALUE.test(line))
        report("error", file, `raw value — token names only; add/scale a token in the org styles instead (LAW 1, docs/design/06): ${line.trim()}`, i + 1);
    });

  let json;
  try {
    json = JSON.parse(src);
  } catch (e) {
    report("error", file, `invalid JSON: ${e.message}`);
    return;
  }

  if (isFixture(file)) return; // legacy fixture, unused — don't choke

  if (isManifest(file)) {
    const root = dirname(file);
    if (isTemplatePath(file)) {
      // TEMPLATE manifest = the envelope. Requires binding + a resolvable root.
      for (const req of ["name", "whenToUse"])
        if (!json[req]) report("warn", file, `template manifest missing "${req}" — ${req === "whenToUse" ? "the AI selects the app by it" : "the display name"} (docs/design/05)`);
      if (!(json.binding && json.binding.workflow))
        report("warn", file, `template manifest has no binding.workflow — the app owns its workflow binding (docs/design/05)`);
      // Two valid roots (definitions.ts:229): the STANDARD manifest-only form (root =
      // layouts/<layout>), OR a `<name>.json` envelope OVERRIDE (its own root). Only the
      // manifest-only form must resolve a layout; an envelope-form template supplies its own.
      const hasEnvelope = existsSync(join(root, basename(root) + ".json"));
      if (!hasEnvelope) {
        const layoutName = json.layout ?? "main";
        if (!existsSync(join(root, "layouts", layoutName + ".json")))
          report("error", file, `manifest.layout "${layoutName}" → layouts/${layoutName}.json does not exist (and no <name>.json envelope) (docs/design/05)`);
      }
      checkStateOrder(json.stateOrder, root, file);
      if (json.mode !== undefined && json.defaultState === undefined)
        report("warn", file, `"mode" was renamed to "defaultState" — still read as a fallback, but rename it (docs/design/04)`);
    } else {
      // COMPONENT manifest = OPTIONAL spatial discovery. No binding. Mirrors the
      // discovery-meta assertions in server/src/runtime/microapp-structure.test.ts.
      const desc = typeof json.description === "string" ? json.description.trim() : "";
      if (desc.length < 20)
        report("error", file, `discovery manifest.description missing/too short — one line (≥20 chars) saying what the component IS (docs/design/03a)`);
      else if (desc.length > 120)
        report("error", file, `discovery manifest.description is ${desc.length} chars — it's the listing subtitle (≤120); move detail into whenToUse (docs/design/03a)`);
      const wtu = typeof json.whenToUse === "string" ? json.whenToUse.trim() : "";
      if (wtu.length < 20)
        report("error", file, `discovery manifest.whenToUse missing/too short — the utterance-shaped selection text findIntent ranks on (docs/design/03a)`);
      else if (/\b(pick when|use (this|when)|when the user|the user (asks|wants|needs)|select (this|when))\b/i.test(wtu))
        report("error", file, `discovery manifest.whenToUse is selector-shaped — write the words the USER would say, not instructions about the user (docs/design/03a)`);
      if (json.binding)
        report("warn", file, `a component discovery manifest has no workflow — drop "binding" (a component is streamed or node-hydrated) (docs/design/03a)`);
    }
    return;
  }

  const isEnvelope = typeof json.unoverse === "string";
  const root = defRoot(file);

  if (isEnvelope) {
    // COMPONENT envelope (templates have no envelope — their manifest is it).
    for (const req of ["kind", "name", "root"])
      if (json[req] === undefined) report("error", file, `envelope missing "${req}" (docs/design/02)`);
    if (json.kind && !["component", "template", "atom"].includes(json.kind))
      report("error", file, `unknown kind "${json.kind}"`);
    if (json.kind === "component" && !json.category)
      report("warn", file, `component has no "category" — used to group it in the palette (docs/design/02)`);
    if (json.root) walkNode(json.root, file, root);

    // ── the contained-microapp discipline (mirrors microapp-structure.test.ts) ──
    if (json.kind === "component") {
      const hasLayouts = existsSync(join(root, "layouts"));
      const statesDir = join(root, "states");
      const stateFiles = existsSync(statesDir)
        ? readdirSync(statesDir).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort()
        : [];
      const hasStateBlock = json.state && typeof json.state === "object";

      // the discovery manifest is the single home for description/whenToUse — no dup
      if (existsSync(join(root, "manifest.json")))
        for (const k of ["description", "whenToUse"])
          if (json[k] !== undefined)
            report("error", file, `envelope duplicates manifest meta "${k}" — the discovery manifest is the single home (docs/design/03a)`);

      // deprecated bridge: a top-level `defaultState` triggers the component node TEMPLATE_DATA emit
      if (json.defaultState !== undefined)
        report("warn", file, `top-level "defaultState" is the deprecated bridge (component-node TEMPLATE_DATA emit) — the master state lives in the \`state\` block; templates react via ComponentSlot.select.where (STATE_MODEL §5b)`);

      // only components that ADOPTED the structure are held to the full discipline
      if (hasLayouts || stateFiles.length || hasStateBlock) {
        const nonInput = Object.entries(json.props ?? {})
          .filter(([, v]) => !(v && typeof v === "object" && v.input === true))
          .map(([k]) => k);
        if (nonInput.length)
          report("error", file, `microapp props [${nonInput.join(", ")}] are not input:true — hardcode content in the layout, or move mutable keys into the \`state\` block (docs/design/03)`);

        // the state block holds SCALAR internal view-state ONLY — an array/object (a
        // finder's result rows) or a URL is content/data slop: hardcode it in the layout,
        // or move workflow-fed data to props (input:true) (AUTHORING §3)
        if (hasStateBlock)
          for (const [k, v] of Object.entries(json.state)) {
            if (Array.isArray(v) || (v && typeof v === "object"))
              report("error", file, `state.${k} is an ${Array.isArray(v) ? "array" : "object"} — the state block is SCALAR view-state only; workflow-fed data → props (input:true), static content → hardcode in the layout (docs/design/03)`);
            else if (typeof v === "string" && /^https?:\/\//.test(v))
              report("error", file, `state.${k} is a URL — content, not view-state; hardcode it in the layout (or props input:true if workflow-fed) (docs/design/03)`);
          }

        if (hasLayouts) {
          const raw = JSON.stringify(json.root ?? {}).replace(/\s/g, "");
          if (!raw.includes('"on":"defaultState"') || !/"\$include":"layouts\//.test(raw))
            report("error", file, `a faced component's root must Switch on defaultState → $include layouts/<state> (the layout filename = the state name, e.g. layouts/inline) (docs/design/03)`);

          // ── face set ⇄ layouts/ cross-check (OPEN name set — inline/focused/<any>) ──
          // The FACES are the root Switch's cases; Studio's face toggle and the render
          // path both derive from them, so cases and layout files must agree exactly.
          const findFaceSwitch = (n) => {
            if (!n || typeof n !== "object") return null;
            if (Array.isArray(n)) { for (const c of n) { const r = findFaceSwitch(c); if (r) return r; } return null; }
            if (n.type === "Switch" && n.on === "defaultState" && n.cases && typeof n.cases === "object") return n;
            for (const v of Object.values(n)) { const r = findFaceSwitch(v); if (r) return r; }
            return null;
          };
          const faceSwitch = findFaceSwitch(json.root);
          if (faceSwitch) {
            const cases = faceSwitch.cases;
            const caseNames = Object.keys(cases).filter((k) => k !== "default");
            // inline is the UNIVERSAL default face: an unknown/absent defaultState must
            // render SOMETHING — require an `inline` case or an explicit `default`.
            if (!caseNames.includes("inline") && cases.default === undefined)
              report("error", file, `faced component's Switch has no "inline" case and no "default" — inline is the universal default face; a component with neither disappears for unknown states (STATE_MODEL §5b)`);
            // Each named case's layout include must MATCH the case name — the layout
            // filename IS the state name (Studio writes defaultState=<case>).
            const usedLayouts = new Set();
            for (const [name, body] of Object.entries(cases)) {
              const inc = body && typeof body === "object" ? body.$include : undefined;
              if (typeof inc !== "string" || !inc.startsWith("layouts/")) continue;
              const layoutName = inc.slice("layouts/".length);
              usedLayouts.add(layoutName);
              if (name !== "default" && layoutName !== name)
                report("error", file, `face case "${name}" includes layouts/${layoutName} — the layout FILENAME is the state name; rename one so they match (docs/design/03)`);
            }
            // Orphan faces: a layouts/*.json no case references is invisible — Studio's
            // face toggle and the renderer only know the Switch's cases.
            const layoutsDir = join(root, "layouts");
            if (existsSync(layoutsDir))
              for (const lf of readdirSync(layoutsDir).filter((f) => f.endsWith(".json"))) {
                const lname = lf.replace(/\.json$/, "");
                if (!usedLayouts.has(lname))
                  report("warn", file, `layouts/${lf} is not referenced by any Switch case — an orphan face is unreachable (add a case "${lname}" or delete the file) (docs/design/03)`);
              }
          }
          // arrival state: the manifest is the render-contract home (default "inline"); the
          // state block is the legacy fallback.
          let mDefault;
          try {
            const mp = join(root, "manifest.json");
            if (existsSync(mp)) mDefault = JSON.parse(readFileSync(mp, "utf8")).defaultState;
          } catch { /* linted separately */ }
          const arrival = mDefault ?? (hasStateBlock ? json.state.defaultState : undefined);
          if (typeof arrival !== "string")
            report("error", file, `a faced component must declare its arrival state in manifest.defaultState (the render contract) or state.defaultState (docs/design/03)`);
        }
        if (stateFiles.length) {
          const order = Array.isArray(json.stateOrder) ? [...json.stateOrder].sort() : null;
          if (!order || !order.length)
            report("error", file, `has states/ but no stateOrder in the envelope (docs/design/03)`);
          else if (JSON.stringify(order) !== JSON.stringify(stateFiles))
            report("error", file, `stateOrder and states/*.json must name the same set (docs/design/03)`);
        }
      }
    } else {
      checkStateOrder(json.stateOrder, root, file); // non-component envelopes (rare)
    }
  } else {
    // bare partial (layouts/ states/ components/ blocks/, or an atom)
    walkNode(json, file, root);
  }
}

// ── run ──
for (const home of homes) for (const f of jsonFiles(home.dir)) lintFile(f);

const by = (lvl) => problems.filter((p) => p.level === lvl);
const icon = { error: "✗", warn: "⚠", hint: "·" };
for (const p of problems) console.log(`${icon[p.level]} ${p.file}${p.line ? ":" + p.line : ""}  ${p.msg}`);
console.log(`\nunoverse lint: ${by("error").length} error(s), ${by("warn").length} warning(s), ${by("hint").length} hint(s) — ${homes.map((h) => relative(process.cwd(), h.dir)).join(", ")}`);
process.exit(by("error").length ? 1 : 0);
