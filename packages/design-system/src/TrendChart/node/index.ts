/**
 * TrendChart Node Definition
 * Auto-generated from Storybook component
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import TrendChartExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "TrendChart";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "TrendChart",
    description: "Pure-SVG time-series line/area chart with gridlines and axis labels. Supports a single series or several overlaid lines with a legend.",
    whenToUse: "Use to show how a metric MOVES OVER TIME (trend, growth, time series). For a single current value use StatCard; for comparing discrete categories use BarChart; for progress toward a goal use ProgressRing.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 640, height: 380 },
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
            "data": {
                  "type": "object",
                  "title": "Single series: array of numbers",
                  "default": [
                        28,
                        31,
                        30,
                        34,
                        33,
                        39,
                        37,
                        42,
                        41,
                        45,
                        44,
                        49
                  ],
                  "ui:field": "template"
            },
            "series": {
                  "type": "object",
                  "title": "Multi-line: array of { name, color, data:number[] } (overrides `data`)",
                  "ui:field": "template"
            },
            "labels": {
                  "type": "object",
                  "title": "X-axis tick labels",
                  "default": [
                        "W1",
                        "W2",
                        "W3",
                        "W4",
                        "W5",
                        "W6",
                        "W7",
                        "W8",
                        "W9",
                        "W10",
                        "W11",
                        "W12"
                  ],
                  "ui:field": "template"
            },
            "title": {
                  "type": "object",
                  "title": "Heading",
                  "default": "Revenue — last 12 weeks",
                  "ui:field": "template"
            },
            "color": {
                  "type": "object",
                  "title": "Line color for single series",
                  "default": "var(--color-chart-1)",
                  "ui:field": "template"
            },
            "area": {
                  "type": "object",
                  "title": "Fill area under the line",
                  "default": true,
                  "ui:field": "template"
            },
            "showDots": {
                  "type": "object",
                  "title": "Draw a dot at each point",
                  "default": false,
                  "ui:field": "template"
            },
            "yMin": {
                  "type": "object",
                  "title": "Force y-axis floor",
                  "ui:field": "template"
            },
            "yMax": {
                  "type": "object",
                  "title": "Force y-axis ceiling",
                  "ui:field": "template"
            },
            "valuePrefix": {
                  "type": "object",
                  "title": "Axis value prefix, e.g. $",
                  "default": "$",
                  "ui:field": "template"
            },
            "valueSuffix": {
                  "type": "object",
                  "title": "Axis value suffix, e.g. % or k",
                  "default": "k",
                  "ui:field": "template"
            }
      },
      "required": []
},
    credentials: [],
  };
}

const definition = createNodeDefinition();

export const TrendChartNode = {
  definition,
  executor: TrendChartExecutor,
};

export { createNodeDefinition as default };
