import { createPlugin, type GravityPluginAPI } from "@unoverse-platform/plugin-base";
import packageJson from "../package.json";

const plugin = createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,

  async setup(api: GravityPluginAPI) {
    const { SlackMCPNode } = await import("./SlackMCP/node");
    api.registerNode(SlackMCPNode);

    const { SlackCredential } = await import("./credentials");
    api.registerCredential(SlackCredential);
  },
});

export default plugin;
