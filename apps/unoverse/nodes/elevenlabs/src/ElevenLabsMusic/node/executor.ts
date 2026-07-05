import { getPlatformDependencies, type NodeExecutionContext } from "@unoverse-platform/plugin-base";
import { resolveCredentials } from "../../shared/elevenLabsClient";
import { composeMusic, type ElevenLabsMusicConfig } from "../service";

const { PromiseNode } = getPlatformDependencies();

const NODE_TYPE = "ElevenLabsMusic";

export default class ElevenLabsMusicExecutor extends PromiseNode {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: ElevenLabsMusicConfig,
    context: NodeExecutionContext,
  ): Promise<any> {
    const { apiKey } = resolveCredentials(context);

    const result = await composeMusic(config, apiKey);

    return {
      __outputs: {
        audio: {
          data: result.audioBase64,
          mimeType: result.contentType,
          fileName: `music_${Date.now()}.mp3`,
        },
        metadata: {
          format: result.format,
          lengthSeconds: config.lengthSeconds ?? null,
          prompt: config.prompt,
        },
      },
    };
  }
}
