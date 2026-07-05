import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import ElevenLabsSoundEffectsExecutor from "./executor";

export const NODE_TYPE = "ElevenLabsSoundEffects";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "ElevenLabs Sound Effects",
    description: "Generate a sound effect clip from a text prompt. Outputs base64 MP3.",
    whenToUse:
      "Generate a sound effect from a text prompt — footsteps on gravel, a door creak, rain, a whoosh, an explosion, ambient room tone. It synthesizes the actual audio of an effect from words, never spoken text, so a description like 'door slam' becomes the sound, not a voice reading it.",
    category: "Media & Design",
    color: "#FF69B4",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1768540562/gravity/icons/elevanlabs.jpg",
    inputs: [
      {
        name: "input",
        type: NodeInputType.STRING,
        required: true,
        description: "Text prompt describing the sound effect to generate",
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
        description: "format, durationSeconds, prompt",
      },
    ],
    configSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          title: "Prompt",
          description: "Describe the sound effect, e.g. 'heavy wooden door slamming shut in a stone corridor'.",
          default: "{{{input}}}",
          "ui:field": "template",
        },
        durationSeconds: {
          type: "number",
          title: "Duration (seconds)",
          description: "0.5–30. Leave blank to let the model choose the optimal length.",
          minimum: 0.5,
          maximum: 30,
        },
        promptInfluence: {
          type: "number",
          title: "Prompt Influence",
          description: "0 = more creative · 1 = follow the prompt strictly (default 0.3).",
          minimum: 0,
          maximum: 1,
          default: 0.3,
        },
        loop: {
          type: "boolean",
          title: "Loopable",
          description: "Generate a seamless looping clip (v2 model).",
          default: false,
          "ui:widget": "toggle",
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
        text: "heavy wooden door slamming shut in a stone corridor",
        durationSeconds: 3,
        promptInfluence: 0.3,
        loop: false,
      },
      inputs: { input: "heavy wooden door slamming shut in a stone corridor" },
    },
  };
}

const definition = createNodeDefinition();

export const ElevenLabsSoundEffectsNode = {
  definition,
  executor: ElevenLabsSoundEffectsExecutor,
};

export { createNodeDefinition };
