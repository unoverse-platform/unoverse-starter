/**
 * NewspaperPage Node Definition
 * Auto-generated from Storybook component
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import NewspaperPageExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "NewspaperPage";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "NewspaperPage",
    description: "NewspaperPage print document from design system",
    category: "Print",
    color: "#8b5cf6",
    template: "printComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 1060, height: 3300 },
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
            "mainArticles": {
                  "type": "object",
                  "title": "Main Articles JSON — Articles 1 & 7 (main story + continuation)",
                  "ui:field": "template"
            },
            "obituary": {
                  "type": "object",
                  "title": "Obituary JSON — Article 8",
                  "ui:field": "template"
            },
            "featureArticles": {
                  "type": "object",
                  "title": "Feature Articles JSON — Articles 2, 4, 6 (local feature, cameo, filler)",
                  "ui:field": "template"
            },
            "newsArticles": {
                  "type": "object",
                  "title": "News Articles JSON — Articles 3 & 5 (red herring + secondary news)",
                  "ui:field": "template"
            },
            "components": {
                  "type": "object",
                  "title": "Components JSON — masthead, banner, sheriff, editor, horoscopes, bestsellers, classifieds (optional, uses generic default)",
                  "ui:field": "template"
            },
            "images": {
                  "type": "object",
                  "title": "Array of 4 image URLs — [article2_photo, article7_photo_left, article7_photo_right, article8_photo]",
                  "ui:field": "template"
            }
      },
      "required": []
},
    credentials: [],
  };
}

const definition = createNodeDefinition();

export const NewspaperPageNode = {
  definition,
  executor: NewspaperPageExecutor,
};

export { createNodeDefinition as default };
