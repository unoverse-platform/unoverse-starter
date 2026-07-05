/**
 * Card Node Definition
 * Auto-generated from Unoverse definition
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import CardExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "Card";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Card",
    description: "Upright, stacked single-item card: image on top, then heading, supporting text and a primary action.",
    whenToUse: "Present a single rich item as an upright stacked card — an image on top with a heading, supporting text and a primary action beneath it. Pick for one item shown on its own in a narrow column, rather than a wide side-by-side banner or a scrollable set of items.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 480, height: 700 },
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "componentSpec", type: NodeInputType.OBJECT, description: "Component spec for downstream nodes" }],
    configSchema: {
      "type": "object",
      "properties": {
            "title": {
                  "type": "string",
                  "title": "title",
                  "default": "Lightsaber Combat Training",
                  "ui:field": "template"
            },
            "description": {
                  "type": "string",
                  "title": "description",
                  "default": "Master the seven forms of lightsaber combat with guidance from Jedi Masters.",
                  "ui:field": "template"
            },
            "image": {
                  "type": "string",
                  "title": "image",
                  "default": "https://res.cloudinary.com/sonik/image/upload/v1761403583/gravity/YodaPark/darth-vader-main_4560aff7.jpg",
                  "ui:field": "template"
            },
            "callToAction": {
                  "type": "string",
                  "title": "callToAction",
                  "default": "Begin Training",
                  "ui:field": "template"
            }
      },
      "required": []
},
    credentials: [],
  };
}

const definition = createNodeDefinition();

export const CardNode = {
  definition,
  executor: CardExecutor,
};

export { createNodeDefinition as default };
