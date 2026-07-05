import { getPlatformDependencies, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import ElevenLabsSpeechToTextExecutor from "./executor";

export const NODE_TYPE = "ElevenLabsSpeechToText";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "ElevenLabs Speech to Text",
    description: "Transcribe an audio or video file to text with ElevenLabs Scribe. Returns the transcript text.",
    whenToUse:
      "Pick to turn recorded audio or video into written text — transcribe a voice note, call, meeting, or media clip so its words become usable in the workflow. Takes a file URL or audio bytes and returns the transcript, with optional per-word timing and speaker labels; it consumes audio rather than producing it.",
    category: "Voice",
    color: "#FF69B4",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1768540562/gravity/icons/elevanlabs.jpg",
    inputs: [
      {
        name: "input",
        type: NodeInputType.STRING,
        required: true,
        description: "URL of the audio/video file to transcribe (or wire base64 audio into the config)",
      },
    ],
    outputs: [
      {
        name: "text",
        type: NodeInputType.STRING,
        description: "The transcript text",
      },
      {
        name: "metadata",
        type: NodeInputType.OBJECT,
        description: "languageCode, languageProbability, wordCount, words[]",
      },
    ],
    configSchema: {
      type: "object",
      properties: {
        audioUrl: {
          type: "string",
          title: "Audio URL",
          description: "URL of an audio/video file for ElevenLabs to fetch and transcribe.",
          default: "{{{input}}}",
          "ui:field": "template",
        },
        audioBase64: {
          type: "string",
          title: "Audio (base64)",
          description: "Alternative to Audio URL — inline base64 audio bytes.",
          "ui:field": "template",
        },
        modelId: {
          type: "string",
          title: "Model",
          enum: ["scribe_v1", "scribe_v2"],
          enumNames: ["Scribe v1", "Scribe v2"],
          default: "scribe_v1",
        },
        languageCode: {
          type: "string",
          title: "Language Code",
          description: "ISO language code (e.g. 'en'). Leave blank to auto-detect.",
          default: "",
        },
        diarize: {
          type: "boolean",
          title: "Diarize Speakers",
          description: "Label distinct speakers in the word list.",
          default: false,
          "ui:widget": "toggle",
        },
        tagAudioEvents: {
          type: "boolean",
          title: "Tag Audio Events",
          description: "Annotate non-speech events like [laughter], [music].",
          default: false,
          "ui:widget": "toggle",
        },
      },
      required: ["audioUrl"],
    },
    credentials: [
      {
        name: "elevenlabsCredential",
        required: true,
      },
    ],
    capabilities: {
      isTrigger: false,
      // Idempotent read: same audio + model → same transcript, no side effects.
      cacheable: true,
    },
    testData: {
      config: {
        audioUrl: "https://storage.googleapis.com/eleven-public-cdn/audio/marketing/nicole.mp3",
        modelId: "scribe_v1",
        languageCode: "en",
        diarize: false,
        tagAudioEvents: false,
      },
      inputs: { input: "https://storage.googleapis.com/eleven-public-cdn/audio/marketing/nicole.mp3" },
    },
  };
}

const definition = createNodeDefinition();

export const ElevenLabsSpeechToTextNode = {
  definition,
  executor: ElevenLabsSpeechToTextExecutor,
};

export { createNodeDefinition };
