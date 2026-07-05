/**
 * ImageBlock Node Definition
 * Auto-generated from Unoverse definition
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import ImageBlockExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "ImageBlock";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "ImageBlock",
    description: "A single image from a URL with an optional caption beneath it.",
    whenToUse: "Show one image from a URL — a photo, screenshot, generated visual, diagram — with an optional caption under it. The plain single-image choice: no title, no action button, no multi-image swiping, so it reads as a quiet figure rather than a promo or a gallery.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 600, height: 460 },
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "componentSpec", type: NodeInputType.OBJECT, description: "Component spec for downstream nodes" }],
    configSchema: {
      "type": "object",
      "properties": {
            "image": {
                  "type": "string",
                  "title": "image",
                  "default": "https://res.cloudinary.com/sonik/image/upload/v1761403583/gravity/YodaPark/starship.webp",
                  "ui:field": "template"
            },
            "alt": {
                  "type": "string",
                  "title": "alt",
                  "default": "Starship in deep space",
                  "ui:field": "template"
            },
            "caption": {
                  "type": "string",
                  "title": "caption",
                  "default": "A starship drifts past a distant nebula.",
                  "ui:field": "template"
            }
      },
      "required": []
},
    credentials: [],
  };
}

const definition = createNodeDefinition();

export const ImageBlockNode = {
  definition,
  executor: ImageBlockExecutor,
};

export { createNodeDefinition as default };
