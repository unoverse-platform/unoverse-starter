/**
 * ListPicker Node Definition
 * Auto-generated from Unoverse definition
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import ListPickerExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "ListPicker";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "ListPicker",
    description: "Vertical list of selectable rows — each an optional thumbnail with a title and supporting subtitle — under an optional heading. One tap selects a row.",
    whenToUse: "Present a short set of choices as a vertical, tappable list of rows — each a title with an optional subtitle and thumbnail — so the user picks exactly one (language choice, menu options, quick actions, branching prompts). Pick when the interaction is selecting a single option from a small list, rather than displaying rich standalone content or a horizontally scrolling gallery of items.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 380, height: 360 },
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "componentSpec", type: NodeInputType.OBJECT, description: "Component spec for downstream nodes" }],
    configSchema: {
      "type": "object",
      "properties": {
            "title": {
                  "type": "string",
                  "title": "title",
                  "default": "Choose a language",
                  "ui:field": "template"
            },
            "subtitle": {
                  "type": "string",
                  "title": "subtitle",
                  "default": "Select your preferred language to continue",
                  "ui:field": "template"
            },
            "elements": {
                  "type": "array",
                  "title": "elements",
                  "default": [
                        {
                              "title": "English",
                              "subtitle": "United States"
                        },
                        {
                              "title": "Español",
                              "subtitle": "Latinoamérica"
                        },
                        {
                              "title": "Français",
                              "subtitle": "France"
                        },
                        {
                              "title": "日本語",
                              "subtitle": "日本"
                        }
                  ],
                  "ui:field": "template"
            }
      },
      "required": []
},
    credentials: [],
  };
}

const definition = createNodeDefinition();

export const ListPickerNode = {
  definition,
  executor: ListPickerExecutor,
};

export { createNodeDefinition as default };
