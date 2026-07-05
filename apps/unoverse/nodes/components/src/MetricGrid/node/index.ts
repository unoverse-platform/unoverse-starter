/**
 * MetricGrid Node Definition
 * Auto-generated from Unoverse definition
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import MetricGridExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "MetricGrid";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "MetricGrid",
    description: "Grid of KPI tiles — each a labelled headline value with an optional prefix/suffix and icon, plus a colour-coded period-over-period delta (up/down/neutral). Sentiment and arrow glyph are resolved by the data producer (deltaPositive/deltaNegative/deltaNeutral + deltaArrow); the definition only composes them — no computation lives in the renderer.",
    whenToUse: "Show several key metrics or KPIs together as a grid of tiles — each a label, a large headline number (with optional currency/percent affix and icon) and a colour-coded change indicator versus the prior period. Pick when summarising multiple numeric stats side by side at a glance, rather than a single standalone statistic or a time-series trend over many points.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 560, height: 360 },
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "componentSpec", type: NodeInputType.OBJECT, description: "Component spec for downstream nodes" }],
    configSchema: {
      "type": "object",
      "properties": {
            "title": {
                  "type": "string",
                  "title": "title",
                  "default": "This month at a glance",
                  "ui:field": "template"
            },
            "metrics": {
                  "type": "array",
                  "title": "metrics",
                  "default": [
                        {
                              "label": "Revenue",
                              "prefix": "$",
                              "value": "48,250",
                              "icon": "💰",
                              "deltaArrow": "▲",
                              "deltaValue": "12.4%",
                              "deltaLabel": "MoM",
                              "deltaPositive": true
                        },
                        {
                              "label": "New Customers",
                              "value": "312",
                              "icon": "👥",
                              "deltaArrow": "▲",
                              "deltaValue": "5.1%",
                              "deltaLabel": "MoM",
                              "deltaPositive": true
                        },
                        {
                              "label": "Churn",
                              "value": "2.3",
                              "suffix": "%",
                              "icon": "📉",
                              "deltaArrow": "▼",
                              "deltaValue": "-0.4pp",
                              "deltaLabel": "MoM",
                              "deltaPositive": true
                        },
                        {
                              "label": "Avg Order Value",
                              "prefix": "$",
                              "value": "154",
                              "icon": "🛒",
                              "deltaArrow": "→",
                              "deltaValue": "0%",
                              "deltaLabel": "flat",
                              "deltaNeutral": true
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

export const MetricGridNode = {
  definition,
  executor: MetricGridExecutor,
};

export { createNodeDefinition as default };
