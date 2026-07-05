import { getPlatformDependencies, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { ElevenLabsConfig, ElevenLabsOutput } from "../util/types";
import { resolveCredentials } from "../../shared/elevenLabsClient";
import { generateTTS } from "../service";

const { PromiseNode } = getPlatformDependencies();

const NODE_TYPE = "ElevenLabs";

export default class ElevenLabsExecutor extends PromiseNode {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: ElevenLabsConfig,
    context: NodeExecutionContext,
  ): Promise<ElevenLabsOutput> {
    const { apiKey } = resolveCredentials(context);

    const result = await generateTTS(config, context, apiKey);

    return {
      __outputs: {
        audio: {
          data: result.audioBase64,
          mimeType: result.contentType,
          fileName: `tts_${Date.now()}.mp3`,
        },
        metadata: {
          format: result.format,
          durationSeconds: result.durationSeconds,
          characterCount: result.characterCount,
          isDialogue: result.isDialogue,
          voiceId: result.voiceId,
        },
      },
    };
  }
}
