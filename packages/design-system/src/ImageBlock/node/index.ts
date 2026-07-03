/**
 * ImageBlock Node Definition
 * Auto-generated from Storybook component
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import ImageBlockExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "ImageBlock";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "ImageBlock",
    description: "Displays a single image with an optional caption.",
    whenToUse: "Use to show one image (photo, screenshot, generated visual) from a URL. For a clickable title+description+image promo use Card; for a swipeable set of images use CardCarousel.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 750, height: 400 },
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "componentSpec", type: NodeInputType.OBJECT, description: "Component spec for downstream nodes" }],
    configSchema: {
      "type": "object",
      "properties": {
            "focusable": {
                  "type": "boolean",
                  "title": "Enable Focus Mode",
                  "description": "Allow this component to expand and become the primary interaction surface",
                  "default": false,
                  "ui:widget": "toggle"
            },
            "focusLabel": {
                  "type": "string",
                  "title": "Focus Mode Label",
                  "description": "Name shown in chat input when this component is focused (e.g., 'Bank Transfer')",
                  "default": "",
                  "ui:dependencies": {
                        "focusable": true
                  }
            },
            "image": {
                  "type": "string",
                  "title": "URL for the image",
                  "default": "https://res.cloudinary.com/sonik/image/upload/v1761403583/gravity/YodaPark/starship.webp",
                  "ui:field": "template"
            },
            "alt": {
                  "type": "string",
                  "title": "Alt text for the image",
                  "default": "Starship in deep space",
                  "ui:field": "template"
            },
            "caption": {
                  "type": "string",
                  "title": "Optional caption shown below the image",
                  "default": "A starship drifts past a distant nebula.",
                  "ui:field": "template"
            },
            "object": {
                  "type": "object",
                  "title": "Full object with image data (image/imageUrl, alt/title, caption)",
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
