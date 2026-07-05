import { getPlatformDependencies, type NodeExecutionContext } from "@unoverse-platform/plugin-base";
import { resolveCredentials } from "../../shared/elevenLabsClient";
import { generateSoundEffect, type ElevenLabsSoundEffectsConfig } from "../service";

const { PromiseNode } = getPlatformDependencies();

const NODE_TYPE = "ElevenLabsSoundEffects";

export default class ElevenLabsSoundEffectsExecutor extends PromiseNode {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: ElevenLabsSoundEffectsConfig,
    context: NodeExecutionContext,
  ): Promise<any> {
    const { apiKey } = resolveCredentials(context);

    const result = await generateSoundEffect(config, apiKey);

    return {
      __outputs: {
        audio: {
          data: result.audioBase64,
          mimeType: result.contentType,
          fileName: `sfx_${Date.now()}.mp3`,
        },
        metadata: {
          format: result.format,
          durationSeconds: config.durationSeconds ?? null,
          prompt: config.text,
        },
      },
    };
  }
}
