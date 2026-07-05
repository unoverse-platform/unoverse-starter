import { getPlatformDependencies, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { resolveCredentials } from "../../shared/elevenLabsClient";
import { generateDialogue, type ElevenLabsDialogueConfig } from "../service";

const { PromiseNode } = getPlatformDependencies();

const NODE_TYPE = "ElevenLabsDialogue";

export default class ElevenLabsDialogueExecutor extends PromiseNode {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: ElevenLabsDialogueConfig,
    context: NodeExecutionContext,
  ): Promise<any> {
    const { apiKey } = resolveCredentials(context);

    // `lines` may arrive resolved from config (object template) or directly on the input.
    const lines = (config.lines && config.lines.length ? config.lines : inputs.lines) || [];
    const result = await generateDialogue({ ...config, lines }, apiKey);

    return {
      __outputs: {
        audio: {
          data: result.audioBase64,
          mimeType: result.contentType,
          fileName: `dialogue_${Date.now()}.mp3`,
        },
        metadata: {
          format: result.format,
          segments: result.segments,
          characterCount: result.characterCount,
        },
      },
    };
  }
}
