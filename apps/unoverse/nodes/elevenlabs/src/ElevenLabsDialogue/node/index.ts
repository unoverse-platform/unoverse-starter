import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import ElevenLabsDialogueExecutor from "./executor";

export const NODE_TYPE = "ElevenLabsDialogue";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "ElevenLabs Dialogue",
    description:
      "Render a multi-speaker script to one continuous audio track, each line spoken in its own voice. Outputs base64 MP3.",
    whenToUse:
      "Multi-speaker conversational audio — voice a dialogue between distinct voices into one continuous track: interview, podcast, character scene, dramatized exchange. Assigns a separate voice per line from an ordered script; a single-voice synthesis collapses the speakers and loses who is talking.",
    category: "Voice",
    color: "#FF69B4",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1768540562/gravity/icons/elevanlabs.jpg",
    inputs: [
      {
        name: "lines",
        type: NodeInputType.ARRAY,
        required: true,
        description: "Ordered lines: [{ text, voiceId }] — or [{ text, speaker }] resolved via voiceMap",
      },
    ],
    outputs: [
      {
        name: "audio",
        type: NodeInputType.OBJECT,
        description: "Generated audio: { data (base64), mimeType, fileName }",
      },
      {
        name: "metadata",
        type: NodeInputType.OBJECT,
        description: "format, segments, characterCount",
      },
    ],
    configSchema: {
      type: "object",
      properties: {
        lines: {
          type: "object",
          title: "Lines",
          description:
            "JS returning an ordered array of { text, voiceId } (or { text, speaker } when using a Voice Map). e.g. return inputs.lines",
          default: "return signal.input.output",
          "ui:field": "template",
        },
        voiceMap: {
          type: "object",
          title: "Voice Map (optional)",
          description:
            "JS returning a speaker → voiceId map, used for lines that set `speaker` instead of `voiceId`. e.g. return { Host: 'voiceA', Guest: 'voiceB' }",
          "ui:field": "template",
        },
        modelId: {
          type: "string",
          title: "Model",
          enum: ["eleven_v3", "eleven_multilingual_v2"],
          enumNames: ["Eleven v3 (expressive)", "Multilingual v2"],
          default: "eleven_v3",
        },
        stability: {
          type: "number",
          title: "Stability",
          description: "0.0 Creative · 0.5 Natural · 1.0 Robust.",
          enum: [0.0, 0.5, 1.0],
          enumNames: ["Creative", "Natural", "Robust"],
          default: 0.5,
        },
      },
      required: ["lines"],
    },
    credentials: [
      {
        name: "elevenlabsCredential",
        required: true,
      },
    ],
    capabilities: {
      isTrigger: false,
    },
    testData: {
      config: {
        lines: [
          { text: "Hey, did you catch the product launch this morning?", voiceId: "21m00Tcm4TlvDq8ikWAM" },
          { text: "I did — it went perfectly, not a single hiccup.", voiceId: "AZnzlk1XvdvUeBnXmlld" },
        ],
        modelId: "eleven_v3",
        stability: 0.5,
      },
      inputs: {
        lines: [
          { text: "Hey, did you catch the product launch this morning?", voiceId: "21m00Tcm4TlvDq8ikWAM" },
          { text: "I did — it went perfectly, not a single hiccup.", voiceId: "AZnzlk1XvdvUeBnXmlld" },
        ],
      },
    },
  };
}

const definition = createNodeDefinition();

export const ElevenLabsDialogueNode = {
  definition,
  executor: ElevenLabsDialogueExecutor,
};

export { createNodeDefinition };
