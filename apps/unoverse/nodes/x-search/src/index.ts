import { createPlugin, type GravityPluginAPI } from "@gravity-platform/plugin-base";
import packageJson from "../package.json";

const plugin = createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,

  async setup(api: GravityPluginAPI) {
    const { XSearchNode } = await import("./XSearch/node");
    api.registerNode(XSearchNode);

    const { XCredential } = await import("./credentials");
    api.registerCredential(XCredential);
  },
});

export default plugin;
