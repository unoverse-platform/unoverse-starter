import { getPlatformDependencies, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import ElevenLabsExecutor from "./executor";

export const NODE_TYPE = "ElevenLabs";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "ElevenLabs TTS",
    description: "Convert text to lifelike spoken audio with any ElevenLabs voice. Outputs base64 MP3.",
    whenToUse:
      "Turn text into natural speech — narration, voiceover, a spoken reply, an audio version of a passage — in a single chosen voice. One-shot synthesis returns a finished MP3; everything speaks in one voice, so a multi-speaker script that needs a different voice per line is a distinct job.",
    category: "Voice",
    color: "#FF69B4",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1768540562/gravity/icons/elevanlabs.jpg",
    inputs: [
      {
        name: "input",
        type: NodeInputType.STRING,
        required: true,
        description: "Text to speak (or a labelled dialogue script for the legacy multi-speaker path)",
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
        description: "format, durationSeconds, characterCount, isDialogue, voiceId",
      },
    ],
    configSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          title: "Text",
          description: "Text to convert to speech. Use [laughs], [sighs] etc. for Eleven v3 audio tags.",
          default: "{{{input}}}",
          "ui:field": "template",
        },
        voiceId: {
          type: "string",
          title: "Voice ID",
          description:
            "ElevenLabs voice ID to speak with (from your Voice Library). Leave blank to use a default voice.",
          default: "",
          "ui:field": "template",
        },
        modelId: {
          type: "string",
          title: "Model",
          description: "TTS model to use.",
          enum: ["eleven_v3", "eleven_multilingual_v2", "eleven_turbo_v2_5", "eleven_flash_v2_5"],
          enumNames: ["Eleven v3 (expressive)", "Multilingual v2", "Turbo v2.5", "Flash v2.5"],
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
        outputFormat: {
          type: "string",
          title: "Output Format",
          description: "Audio codec + bitrate. Leave blank for the ElevenLabs default.",
          enum: ["", "mp3_44100_128", "mp3_44100_192", "mp3_22050_32"],
          enumNames: ["Default", "MP3 44.1kHz 128kbps", "MP3 44.1kHz 192kbps", "MP3 22kHz 32kbps"],
          default: "",
        },
      },
      required: ["text"],
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
        text: "Welcome to Gravity. Your workflow is now live and running.",
        voiceId: "21m00Tcm4TlvDq8ikWAM",
        modelId: "eleven_v3",
        stability: 0.5,
        outputFormat: "",
      },
      inputs: { input: "Welcome to Gravity. Your workflow is now live and running." },
    },
  };
}

const definition = createNodeDefinition();

export const ElevenLabsNode = {
  definition,
  executor: ElevenLabsExecutor,
};

export { createNodeDefinition };
