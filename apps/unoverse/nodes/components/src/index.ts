/**
 * Unoverse Design System Plugin — DEFINITION-BACKED, ZERO GENERATED CODE.
 *
 * One universal PromiseNode executor serves every design component; the per-
 * component NODE DEFINITIONS are synthesized at load time from the rx defs
 * (rx/components/*). Drag a component onto the canvas and it just works:
 * a new component JSON is a working node on next load — no generator, no
 * per-component compile, no regen cycle. (The old nodegen pipeline emitted
 * ~150 lines of identical executor code per component; the only variance was
 * the prop names, which are data. See lib/executor.ts + lib/meta.ts.)
 */

import { createPlugin, type GravityPluginAPI } from "@unoverse-platform/plugin-base";
import packageJson from "../package.json";
import { findRxComponentsDir, loadComponentDefs, synthesize } from "./lib/meta";
import { makeExecutorClass } from "./lib/executor";

const plugin = createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,

  async setup(api: GravityPluginAPI) {
    const { initializePlatformFromAPI } = await import("@unoverse-platform/plugin-base");
    initializePlatformFromAPI(api);

    const rxDir = findRxComponentsDir();
    if (!rxDir) {
      console.warn("[components] rx/components not found (set UNOVERSE_RX_DIR) — no design-component nodes registered");
      return;
    }

    for (const def of loadComponentDefs(rxDir)) {
      const { definition, meta } = synthesize(def);
      api.registerNode({ definition, executor: makeExecutorClass(meta) } as any);
    }
  },
});

export default plugin;
