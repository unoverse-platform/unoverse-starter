import { createPlugin, type GravityPluginAPI } from "@unoverse-platform/plugin-base";
import packageJson from "../package.json";

const plugin = createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,

  async setup(api: GravityPluginAPI) {
    // Initialize platform dependencies
    const { initializePlatformFromAPI } = await import("@unoverse-platform/plugin-base");
    initializePlatformFromAPI(api);

    // Import and register AWSComprehendMedical node
    const { AWSComprehendMedicalNode } = await import("./AWSComprehendMedical/node/index");
    api.registerNode(AWSComprehendMedicalNode);

    // Import and register AWS credential
    const { AWSCredential } = await import("./credentials");
    api.registerCredential(AWSCredential);
  },
});

export default plugin;
