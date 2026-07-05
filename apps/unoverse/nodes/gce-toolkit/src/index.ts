/**
 * @unoverse-platform/gce-imagegen
 * Google Gemini Image Generation integration for Gravity platform
 */

import { createPlugin, type GravityPluginAPI } from "@unoverse-platform/plugin-base";
import packageJson from "../package.json";

const plugin = createPlugin({
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,

  async setup(api: GravityPluginAPI) {
    // First, set up platform dependencies
    const { setPlatformDependencies } = await import("@unoverse-platform/plugin-base");
    setPlatformDependencies({
      PromiseNode: api.classes.PromiseNode,
      CallbackNode: api.classes.CallbackNode,
      NodeInputType: api.types.NodeInputType,
      NodeConcurrency: api.types.NodeConcurrency,
      getNodeCredentials: api.getNodeCredentials,
      getConfig: api.getConfig,
      createLogger: api.createLogger,
      saveTokenUsage: api.saveTokenUsage,
      NodeInput: null,
      NodeOutput: null,
      NodeDefinition: null,
      NodeExecutor: null,
      NodeExecutionContext: null,
      NodeLifecycle: null,
      WorkflowNode: null,
      EnhancedNodeDefinition: null,
      NodeCredential: null,
      ValidationResult: null,
    } as any);

    // Import node after dependencies are set
    const { GeminiImageGenNode } = await import("./GeminiImageGen/node");

    // Import credential
    const { GeminiCredential } = await import("./credentials");

    // Register node - pass the complete node object
    api.registerNode(GeminiImageGenNode);

    // Register credential
    api.registerCredential(GeminiCredential);

    // Import and register service
    const { generateImages } = await import("./GeminiImageGen/service");

    // Register service for platform use
    api.registerService("gemini-image-gen", generateImages);
  },
});

export default plugin;
