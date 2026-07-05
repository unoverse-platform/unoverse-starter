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

    // Import and register DynamoDB node
    const { DynamoDBNode } = await import("./DynamoDB/node/index");
    api.registerNode(DynamoDBNode);

    // Import and register DynamoDBFetch node
    const { DynamoDBFetchNode } = await import("./DynamoDBFetch/node/index");
    api.registerNode(DynamoDBFetchNode);

    // Import and register DynamoDBService node
    const { DynamoDBServiceNode } = await import("./DynamoDBService/node/index");
    api.registerNode(DynamoDBServiceNode);

    // Import and register AWS credential
    const { AWSCredential } = await import("./credentials/index");
    api.registerCredential(AWSCredential);
  },
});

export default plugin;
