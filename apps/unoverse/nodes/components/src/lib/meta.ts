/**
 * Definition → node synthesis (runtime, data-driven).
 *
 * The rx component definition IS the node: this module reads a definition (+ its
 * optional manifest.json) and synthesizes the SAME EnhancedNodeDefinition the old
 * generator emitted as code — same configSchema derivation, same output contract,
 * same category/template/logo — so the canvas, the builder catalog, and existing
 * workflows see byte-identical nodes with ZERO generated code and ZERO recompiles:
 * a new component JSON is a working node on next load.
 */

import { readdirSync, readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { NodeInputType, inputPropKeys, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";

export interface UnoverseDefinition {
  name: string;
  kind?: string;
  description?: string;
  whenToUse?: string;
  category?: string;
  defaultState?: string;
  nodeSize?: { width: number; height: number };
  props?: Record<string, { type?: string; description?: string; default?: unknown; input?: boolean }>;
  outputs?: Record<string, { type?: string; description?: string }>;
}

/** What the universal executor needs per component — all data, no code. */
export interface RuntimeComponentMeta {
  name: string;
  /** Input prop keys in def order, with their declared types (for the string "" pin). */
  inputProps: Array<{ key: string; isString: boolean }>;
  nodeSize?: { width: number; height: number };
  /** Named default state the component opens in (open name; TEMPLATE_DATA emit). */
  defaultState?: string;
  /** Declared output contract keys (interactive components — awaitSubmission leg). */
  outputKeys: string[];
}

const DEF_TYPE_TO_SCHEMA: Record<string, string> = {
  string: "string",
  number: "number",
  boolean: "boolean",
  object: "object",
  array: "array",
};

/** Mirror of the legacy generator's metadata + configSchema derivation. */
export function synthesize(def: UnoverseDefinition): { definition: EnhancedNodeDefinition; meta: RuntimeComponentMeta } {
  const inputKeys = new Set(inputPropKeys(def.props));

  // configSchema — the legacy NodeIndexGenerator derivation, verbatim semantics.
  const properties: Record<string, any> = {};
  const inputProps: RuntimeComponentMeta["inputProps"] = [];
  for (const [key, prop] of Object.entries(def.props ?? {})) {
    if (!inputKeys.has(key)) continue; // hardcoded content — stays in the definition
    const schemaType = DEF_TYPE_TO_SCHEMA[prop?.type ?? "string"] ?? "string";
    properties[key] = {
      type: schemaType,
      title: prop?.description ?? key,
      ...(prop?.default !== undefined && { default: prop.default }),
    };
    // String/object/array props are workflow-bindable — they edit as a template field.
    if (schemaType === "string" || schemaType === "object" || schemaType === "array") {
      properties[key]["ui:field"] = "template";
    }
    if (schemaType === "boolean") properties[key]["ui:widget"] = "toggle";
    // Legacy parity: the aggregate "object" prop is excluded from the publish loop
    // (it silently overrode named props with null — removed from nodegen long ago).
    if (key !== "object") inputProps.push({ key, isString: schemaType === "string" });
  }

  const outputKeys = Object.keys(def.outputs ?? {});
  const outputs = outputKeys.length
    ? [{ name: "output", type: NodeInputType.OBJECT, description: `Submitted component outputs: ${outputKeys.join(", ")}` }]
    : [{ name: "componentSpec", type: NodeInputType.OBJECT, description: "Component spec for downstream nodes" }];

  // Named default state — open name, declared in the def envelope, with the legacy
  // prop-default derivation kept as fallback (displayState/defaultState "focused" ⇒ "focus").
  const defaultState =
    def.defaultState ??
    (((def.props as any)?.defaultState?.default ?? (def.props as any)?.displayState?.default) === "focused"
      ? "focus"
      : undefined);

  const definition: EnhancedNodeDefinition = {
    packageVersion: "1.0.0",
    type: def.name,
    name: def.name,
    description: def.description || `${def.name} UI component from design system`,
    ...(def.whenToUse ? { whenToUse: def.whenToUse } : {}),
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: { componentUrl: `unoverse://components/${def.name}` },
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    ...(def.nodeSize ? { nodeSize: { width: def.nodeSize.width, height: def.nodeSize.height } } : {}),
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs,
    configSchema: { type: "object", properties, required: [] },
    credentials: [],
  } as EnhancedNodeDefinition;

  return {
    definition,
    meta: {
      name: def.name,
      inputProps,
      nodeSize: def.nodeSize,
      defaultState,
      outputKeys,
    },
  };
}

/**
 * Load every component definition from the rx home. Components live flat
 * (`<name>.json`) or in their own folder (`<name>/<name>.json`) — mirrors the
 * server's definition loader. A sibling `manifest.json` (component apps) may
 * supply discoverability meta the def lacks: manifest wins per the protocol
 * ("Manifest wins over the def for every field").
 */
export function loadComponentDefs(rxComponentsDir: string): UnoverseDefinition[] {
  const defs: UnoverseDefinition[] = [];
  for (const entry of readdirSync(rxComponentsDir, { withFileTypes: true })) {
    let file: string | undefined;
    if (entry.isDirectory()) {
      const sub = join(rxComponentsDir, entry.name);
      const jsons = readdirSync(sub).filter((f) => f.endsWith(".json") && f !== "manifest.json");
      file =
        jsons.find((f) => f.toLowerCase() === `${entry.name.toLowerCase()}.json`) ??
        jsons.find((f) => f === "index.json") ??
        jsons[0];
      if (file) file = join(sub, file);
    } else if (entry.name.endsWith(".json")) {
      file = join(rxComponentsDir, entry.name);
    }
    if (!file) continue;
    try {
      const def = JSON.parse(readFileSync(file, "utf8")) as UnoverseDefinition;
      if (def.kind !== "component") continue;
      const manifestPath = join(dirname(file), "manifest.json");
      if (existsSync(manifestPath)) {
        const m = JSON.parse(readFileSync(manifestPath, "utf8"));
        if (m.description) def.description = m.description;
        if (m.whenToUse) def.whenToUse = m.whenToUse;
        if (m.category) def.category = m.category;
      }
      defs.push(def);
    } catch {
      // A malformed def never takes the whole family down — skip it.
    }
  }
  return defs;
}

/** Resolve the rx/components home: env override, else walk up from this package.
 *  Checks BOTH `<ancestor>/rx` (package inside apps/unoverse/nodes — dev + starter
 *  carve-out) and `<ancestor>/apps/unoverse/rx` (package npm-installed under the
 *  plugins tree — DOCR deployments, where rx lives in the image / mounted carve-out). */
export function findRxComponentsDir(): string | null {
  if (process.env.UNOVERSE_RX_DIR) {
    const p = join(process.env.UNOVERSE_RX_DIR, "components");
    return existsSync(p) ? p : null;
  }
  let dir = __dirname;
  for (let i = 0; i < 8; i++) {
    for (const candidate of [join(dir, "rx", "components"), join(dir, "apps", "unoverse", "rx", "components")]) {
      if (existsSync(candidate)) return candidate;
    }
    dir = dirname(dir);
  }
  return null;
}
