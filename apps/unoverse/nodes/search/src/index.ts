import { createPlugin, type GravityPluginAPI } from "@unoverse-platform/plugin-base";
import packageJson from "../package.json";

const plugin = createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,

  async setup(api: GravityPluginAPI) {
    const { SearchWebNode } = await import("./SearchWeb/node");
    api.registerNode(SearchWebNode);

    const { SearchNewsNode } = await import("./SearchNews/node");
    api.registerNode(SearchNewsNode);

    const { SearchVideosNode } = await import("./SearchVideos/node");
    api.registerNode(SearchVideosNode);

    const { SearchPlacesNode } = await import("./SearchPlaces/node");
    api.registerNode(SearchPlacesNode);

    const { SearchAPICredential } = await import("./credentials");
    api.registerCredential(SearchAPICredential);
  },
});

export default plugin;
