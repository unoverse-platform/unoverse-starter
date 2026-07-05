import { createPlugin, type GravityPluginAPI } from "@unoverse-platform/plugin-base";
import packageJson from "../package.json";

const plugin = createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,

  async setup(api: GravityPluginAPI) {
    const { SalesforceMCPNode } = await import("./SalesforceMCP/node");
    api.registerNode(SalesforceMCPNode);

    const { SalesforceCredential } = await import("./credentials");
    api.registerCredential(SalesforceCredential);
  },
});

export default plugin;
