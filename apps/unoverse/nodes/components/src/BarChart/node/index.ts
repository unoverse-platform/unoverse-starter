/**
 * BarChart Node Definition
 * Auto-generated from Unoverse definition
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import BarChartExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "BarChart";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "BarChart",
    description: "Interactive vertical bar chart of labelled values. Composed from Box + Each + Button (NOT a chart primitive): each bar is a Button whose height binds to a producer-supplied proportion (`pct`, e.g. \"72%\"); tapping a bar writes the selection to the store (cross-filter). Value labels sit on each bar, months below, on a baseline. Colour is a served token.",
    whenToUse: "Compare a handful of labelled numeric values side by side as vertical bars — counts, revenue by period, totals by category — optionally letting the user tap a bar to select it. Pick when comparing across discrete categories at one point in time, rather than a trend over many points or a single headline statistic.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 560, height: 380 },
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "componentSpec", type: NodeInputType.OBJECT, description: "Component spec for downstream nodes" }],
    configSchema: {
      "type": "object",
      "properties": {
            "title": {
                  "type": "string",
                  "title": "title",
                  "default": "Revenue by month",
                  "ui:field": "template"
            },
            "bars": {
                  "type": "array",
                  "title": "bars",
                  "default": [
                        {
                              "label": "Jan",
                              "value": "42",
                              "pct": "60%"
                        },
                        {
                              "label": "Feb",
                              "value": "55",
                              "pct": "79%"
                        },
                        {
                              "label": "Mar",
                              "value": "38",
                              "pct": "54%"
                        },
                        {
                              "label": "Apr",
                              "value": "70",
                              "pct": "100%"
                        },
                        {
                              "label": "May",
                              "value": "61",
                              "pct": "87%"
                        },
                        {
                              "label": "Jun",
                              "value": "49",
                              "pct": "70%"
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

export const BarChartNode = {
  definition,
  executor: BarChartExecutor,
};

export { createNodeDefinition as default };
