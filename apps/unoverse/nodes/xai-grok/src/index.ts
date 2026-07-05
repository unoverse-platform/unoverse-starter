import { createPlugin, type GravityPluginAPI } from "@gravity-platform/plugin-base";
import packageJson from "../package.json";

const plugin = createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,

  async setup(api: GravityPluginAPI) {
    const { initializePlatformFromAPI } = await import("@gravity-platform/plugin-base");
    initializePlatformFromAPI(api);

    // Initialize WebSocket audio subscriber for mic → Grok audio
    const { GrokWebSocketAudioSubscriber } = await import(
      "./Grok/service/io/websocket/GrokWebSocketAudioSubscriber"
    );
    GrokWebSocketAudioSubscriber.getInstance();

    const { GrokVoiceNode } = await import("./Grok/node");
    api.registerNode(GrokVoiceNode);

    const { XAICredential } = await import("./credentials");
    api.registerCredential(XAICredential);
  },
});

export default plugin;
