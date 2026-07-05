/**
 * KenBurnsImage Node Definition
 * Auto-generated from Unoverse definition
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import KenBurnsImageExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "KenBurnsImage";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "KenBurnsImage",
    description: "Full-bleed image with a slow Ken Burns zoom and a darkening vignette overlay.",
    whenToUse: "A hero / background image that fills its container with subtle motion. For a static inline image use the Image atom; for an image with title + text + action use Card.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "componentSpec", type: NodeInputType.OBJECT, description: "Component spec for downstream nodes" }],
    configSchema: {
      "type": "object",
      "properties": {
            "src": {
                  "type": "string",
                  "title": "src",
                  "default": "https://res.cloudinary.com/sonik/image/upload/v1761403583/gravity/YodaPark/darth-vader-main_4560aff7.jpg",
                  "ui:field": "template"
            },
            "alt": {
                  "type": "string",
                  "title": "alt",
                  "default": "",
                  "ui:field": "template"
            },
            "overlay": {
                  "type": "boolean",
                  "title": "overlay",
                  "default": true,
                  "ui:widget": "toggle"
            }
      },
      "required": []
},
    credentials: [],
  };
}

const definition = createNodeDefinition();

export const KenBurnsImageNode = {
  definition,
  executor: KenBurnsImageExecutor,
};

export { createNodeDefinition as default };
