/**
 * BarList Node Definition
 * Auto-generated from Unoverse definition
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import BarListExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "BarList";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "BarList",
    description: "Ranked list of horizontal bars — each row a label, a track with a {{pct}}-bound fill, and a value. Composed from Box + Each (no chart primitive); the fill proportions are supplied by the data producer.",
    whenToUse: "Rank or compare named items as horizontal bars with their values — top sources, leaderboards, breakdowns, share-of-total. Pick when items have long labels or you want a compact ranked list, rather than vertical bars or a single statistic.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 460, height: 320 },
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "componentSpec", type: NodeInputType.OBJECT, description: "Component spec for downstream nodes" }],
    configSchema: {
      "type": "object",
      "properties": {
            "title": {
                  "type": "string",
                  "title": "title",
                  "default": "Top traffic sources",
                  "ui:field": "template"
            },
            "items": {
                  "type": "array",
                  "title": "items",
                  "default": [
                        {
                              "label": "Organic search",
                              "value": "12,480",
                              "pct": "100%"
                        },
                        {
                              "label": "Direct",
                              "value": "8,210",
                              "pct": "66%"
                        },
                        {
                              "label": "Social",
                              "value": "5,940",
                              "pct": "48%"
                        },
                        {
                              "label": "Referral",
                              "value": "3,120",
                              "pct": "25%"
                        },
                        {
                              "label": "Email",
                              "value": "1,870",
                              "pct": "15%"
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

export const BarListNode = {
  definition,
  executor: BarListExecutor,
};

export { createNodeDefinition as default };
