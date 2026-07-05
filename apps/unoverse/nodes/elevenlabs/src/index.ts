import { createPlugin, type GravityPluginAPI } from "@unoverse-platform/plugin-base";
import packageJson from "../package.json";

const plugin = createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,

  async setup(api: GravityPluginAPI) {
    const { ElevenLabsNode } = await import("./ElevenLabs/node");
    api.registerNode(ElevenLabsNode);

    const { ElevenLabsDialogueNode } = await import("./ElevenLabsDialogue/node");
    api.registerNode(ElevenLabsDialogueNode);

    const { ElevenLabsSoundEffectsNode } = await import("./ElevenLabsSoundEffects/node");
    api.registerNode(ElevenLabsSoundEffectsNode);

    const { ElevenLabsSpeechToTextNode } = await import("./ElevenLabsSpeechToText/node");
    api.registerNode(ElevenLabsSpeechToTextNode);

    const { ElevenLabsMusicNode } = await import("./ElevenLabsMusic/node");
    api.registerNode(ElevenLabsMusicNode);

    const { ElevenLabsCredential } = await import("./credentials");
    api.registerCredential(ElevenLabsCredential);
  },
});

export default plugin;
