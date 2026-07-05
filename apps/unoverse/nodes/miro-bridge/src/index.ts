import { createPlugin, type GravityPluginAPI } from "@unoverse-platform/plugin-base";
import packageJson from "../package.json";

const plugin = createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,

  async setup(api: GravityPluginAPI) {
    const { initializePlatformFromAPI } = await import("@unoverse-platform/plugin-base");
    initializePlatformFromAPI(api);

    const { MiroBridgeNode } = await import("./MiroBridge/node");
    api.registerNode(MiroBridgeNode);

    const { MiroCredential } = await import("./credentials");
    api.registerCredential(MiroCredential);
  },
});

export default plugin;
