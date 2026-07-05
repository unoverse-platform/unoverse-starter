/**
 * StatCard Node Definition
 * Auto-generated from Unoverse definition
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import StatCardExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "StatCard";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "StatCard",
    description: "Single hero KPI card: a label, a large headline value, a colour-coded period-over-period delta, and a compact bar trend. Composed from Box + Each + {{pct}}-bound bars (no chart primitive); delta sentiment (deltaPositive/deltaNegative/deltaNeutral) and the trend proportions are resolved by the data producer.",
    whenToUse: "Spotlight ONE key metric on its own — a single big number with its change versus the prior period and a small trend. Pick for a single prominent statistic, rather than several metrics together (a grid) or a full comparison of categories (a bar chart).",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 360, height: 260 },
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "componentSpec", type: NodeInputType.OBJECT, description: "Component spec for downstream nodes" }],
    configSchema: {
      "type": "object",
      "properties": {
            "label": {
                  "type": "string",
                  "title": "label",
                  "default": "Monthly Revenue",
                  "ui:field": "template"
            },
            "value": {
                  "type": "string",
                  "title": "value",
                  "default": "$48,250",
                  "ui:field": "template"
            },
            "deltaArrow": {
                  "type": "string",
                  "title": "deltaArrow",
                  "default": "▲",
                  "ui:field": "template"
            },
            "deltaValue": {
                  "type": "string",
                  "title": "deltaValue",
                  "default": "12.4%",
                  "ui:field": "template"
            },
            "deltaLabel": {
                  "type": "string",
                  "title": "deltaLabel",
                  "default": "vs last month",
                  "ui:field": "template"
            },
            "deltaPositive": {
                  "type": "boolean",
                  "title": "deltaPositive",
                  "default": true,
                  "ui:widget": "toggle"
            },
            "deltaNegative": {
                  "type": "boolean",
                  "title": "deltaNegative",
                  "default": false,
                  "ui:widget": "toggle"
            },
            "deltaNeutral": {
                  "type": "boolean",
                  "title": "deltaNeutral",
                  "default": false,
                  "ui:widget": "toggle"
            },
            "trend": {
                  "type": "array",
                  "title": "trend",
                  "default": [
                        {
                              "pct": "40%"
                        },
                        {
                              "pct": "55%"
                        },
                        {
                              "pct": "48%"
                        },
                        {
                              "pct": "62%"
                        },
                        {
                              "pct": "58%"
                        },
                        {
                              "pct": "75%"
                        },
                        {
                              "pct": "70%"
                        },
                        {
                              "pct": "88%"
                        },
                        {
                              "pct": "82%"
                        },
                        {
                              "pct": "100%"
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

export const StatCardNode = {
  definition,
  executor: StatCardExecutor,
};

export { createNodeDefinition as default };
