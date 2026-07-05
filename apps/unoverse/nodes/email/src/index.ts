import { createPlugin, type GravityPluginAPI } from "@unoverse-platform/plugin-base";
import packageJson from "../package.json";

const plugin = createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,

  async setup(api: GravityPluginAPI) {
    const { initializePlatformFromAPI } = await import("@unoverse-platform/plugin-base");
    initializePlatformFromAPI(api);

    const { SendEmailNode } = await import("./SendEmail/node");
    api.registerNode(SendEmailNode);

    const { Microsoft365Credential } = await import("./credentials");
    api.registerCredential(Microsoft365Credential);
  },
});

export default plugin;
