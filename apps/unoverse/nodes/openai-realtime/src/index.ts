import { createPlugin, type GravityPluginAPI } from "@gravity-platform/plugin-base";
import packageJson from "../package.json";

const plugin = createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,

  async setup(api: GravityPluginAPI) {
    const { initializePlatformFromAPI } = await import("@gravity-platform/plugin-base");
    initializePlatformFromAPI(api);

    const { RealtimeVoiceNode } = await import("./Realtime/node");
    api.registerNode(RealtimeVoiceNode);

    const { OpenAICredential } = await import("./credentials");
    api.registerCredential(OpenAICredential);
  },
});

export default plugin;
