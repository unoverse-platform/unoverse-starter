import { getPlatformDependencies, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { resolveCredentials } from "../../shared/elevenLabsClient";
import { transcribe, type ElevenLabsSpeechToTextConfig } from "../service";

const { PromiseNode } = getPlatformDependencies();

const NODE_TYPE = "ElevenLabsSpeechToText";

export default class ElevenLabsSpeechToTextExecutor extends PromiseNode {
  constructor() {
    super(NODE_TYPE);
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: ElevenLabsSpeechToTextConfig,
    context: NodeExecutionContext,
  ): Promise<any> {
    const { apiKey } = resolveCredentials(context);

    const result = await transcribe(config, apiKey);

    return {
      __outputs: {
        text: result.text,
        metadata: {
          languageCode: result.languageCode,
          languageProbability: result.languageProbability,
          wordCount: result.words.length,
          words: result.words,
        },
      },
    };
  }
}
