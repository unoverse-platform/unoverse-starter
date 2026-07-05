/**
 * @gravity-platform/zai
 * Z.AI (GLM) integration for the Gravity platform
 */

import { createPlugin, type GravityPluginAPI } from "@gravity-platform/plugin-base";
import packageJson from "../package.json";

const plugin = createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,

  async setup(api: GravityPluginAPI) {
    const { initializePlatformFromAPI } = await import("@gravity-platform/plugin-base");
    initializePlatformFromAPI(api);

    const { GLMAgentNode } = await import("./GLMAgent/node");
    const { ZAICredential } = await import("./credentials");

    api.registerNode(GLMAgentNode);
    api.registerCredential(ZAICredential);
  },
});

export default plugin;
