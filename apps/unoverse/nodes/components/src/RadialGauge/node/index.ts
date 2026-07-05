/**
 * RadialGauge Node Definition
 * Auto-generated from Unoverse definition
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import RadialGaugeExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "RadialGauge";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "RadialGauge",
    description: "Radial progress dial: a circular ring filled to a producer-supplied proportion ({{pct}}), with a value and label in the centre. Composed from a circular Box using the neutral `radial` style (a served fill token sweeping to the stop over a served track token) plus a centred hole — no chart primitive.",
    whenToUse: "Show a single value as progress toward a whole — completion %, goal attainment, utilisation, a score out of 100. Pick for one proportion shown as a ring dial, rather than several metrics (a grid) or a comparison of categories (a bar chart).",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 340, height: 360 },
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "componentSpec", type: NodeInputType.OBJECT, description: "Component spec for downstream nodes" }],
    configSchema: {
      "type": "object",
      "properties": {
            "title": {
                  "type": "string",
                  "title": "title",
                  "default": "Quarterly goal",
                  "ui:field": "template"
            },
            "pct": {
                  "type": "string",
                  "title": "pct",
                  "default": "72%",
                  "ui:field": "template"
            },
            "centerValue": {
                  "type": "string",
                  "title": "centerValue",
                  "default": "72%",
                  "ui:field": "template"
            },
            "label": {
                  "type": "string",
                  "title": "label",
                  "default": "of target",
                  "ui:field": "template"
            }
      },
      "required": []
},
    credentials: [],
  };
}

const definition = createNodeDefinition();

export const RadialGaugeNode = {
  definition,
  executor: RadialGaugeExecutor,
};

export { createNodeDefinition as default };
