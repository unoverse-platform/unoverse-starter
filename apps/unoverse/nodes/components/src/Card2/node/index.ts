/**
 * Card2 Node Definition
 * Auto-generated from Unoverse definition
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import Card2Executor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "Card2";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Card2",
    description: "Horizontal feature card: heading, description and a call-to-action beside a large image with a brand accent bar.",
    whenToUse: "Present a single feature or offer as a wide horizontal banner — a heading, supporting text and a call-to-action button on one side, a large image on the other. Pick when the layout should run side by side across the full width rather than stack vertically in a narrow column.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 760, height: 320 },
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "componentSpec", type: NodeInputType.OBJECT, description: "Component spec for downstream nodes" }],
    configSchema: {
      "type": "object",
      "properties": {
            "title": {
                  "type": "string",
                  "title": "title",
                  "default": "Force Sensitivity Assessment",
                  "ui:field": "template"
            },
            "description": {
                  "type": "string",
                  "title": "description",
                  "default": "Discover your connection to the Force with advanced midi-chlorian analysis. Receive personalized training recommendations and track your progress on the path to becoming a Jedi.",
                  "ui:field": "template"
            },
            "image": {
                  "type": "string",
                  "title": "image",
                  "default": "https://res.cloudinary.com/sonik/image/upload/v1761403583/gravity/YodaPark/force.avif",
                  "ui:field": "template"
            },
            "callToAction": {
                  "type": "string",
                  "title": "callToAction",
                  "default": "Start Assessment",
                  "ui:field": "template"
            }
      },
      "required": []
},
    credentials: [],
  };
}

const definition = createNodeDefinition();

export const Card2Node = {
  definition,
  executor: Card2Executor,
};

export { createNodeDefinition as default };
