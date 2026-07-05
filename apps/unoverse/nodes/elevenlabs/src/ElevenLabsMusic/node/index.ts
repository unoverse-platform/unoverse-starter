import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import ElevenLabsMusicExecutor from "./executor";

export const NODE_TYPE = "ElevenLabsMusic";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "ElevenLabs Music",
    description: "Compose an original music track from a text prompt. Outputs base64 MP3.",
    whenToUse:
      "Pick to generate an original piece of music from a description — a background track, theme, jingle, or soundtrack, with melody, rhythm, and optional vocals. It composes a full structured musical track to a chosen length; a short non-musical sound is a different job, and reading words aloud is not music at all.",
    category: "Media & Design",
    color: "#FF69B4",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1768540562/gravity/icons/elevanlabs.jpg",
    inputs: [
      {
        name: "input",
        type: NodeInputType.STRING,
        required: true,
        description: "Text prompt describing the music to compose",
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
        description: "format, lengthSeconds, prompt",
      },
    ],
    configSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          title: "Prompt",
          description:
            "Describe the music, e.g. 'upbeat lo-fi hip-hop with a warm piano loop and soft vinyl crackle'. Tracks default toward instrumental — to get singing, ask for it explicitly, e.g. 'with a female vocalist singing lyrics about late-night city drives'.",
          default: "{{{input}}}",
          "ui:field": "template",
        },
        lengthSeconds: {
          type: "number",
          title: "Length (seconds)",
          description: "3–600. Leave blank to let the model choose the length.",
          minimum: 3,
          maximum: 600,
        },
        modelId: {
          type: "string",
          title: "Model",
          enum: ["music_v1", "music_v2"],
          enumNames: ["Music v1", "Music v2"],
          default: "music_v1",
        },
        forceInstrumental: {
          type: "boolean",
          title: "Instrumental Only",
          description: "Compose without vocals.",
          default: false,
          "ui:widget": "toggle",
        },
      },
      required: ["prompt"],
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
        prompt: "upbeat lo-fi hip-hop with a warm piano loop and soft vinyl crackle",
        lengthSeconds: 30,
        modelId: "music_v1",
        forceInstrumental: true,
      },
      inputs: { input: "upbeat lo-fi hip-hop with a warm piano loop and soft vinyl crackle" },
    },
  };
}

const definition = createNodeDefinition();

export const ElevenLabsMusicNode = {
  definition,
  executor: ElevenLabsMusicExecutor,
};

export { createNodeDefinition };
