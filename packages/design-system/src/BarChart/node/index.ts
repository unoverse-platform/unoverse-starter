/**
 * BarChart Node Definition
 * Auto-generated from Storybook component
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
    description: "Categorical bar chart (vertical or horizontal) with per-bar colors and value labels. Compares discrete categories at a glance.",
    whenToUse: "Use to COMPARE DISCRETE CATEGORIES (revenue by channel, count by status). For change over time use TrendChart; for a single value use StatCard; for a share of a whole / goal use ProgressRing.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 600, height: 360 },
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
                  "title": "Array of { label, value, color? }",
                  "default": [
                        {
                              "label": "Direct",
                              "value": 42
                        },
                        {
                              "label": "Organic",
                              "value": 31
                        },
                        {
                              "label": "Paid",
                              "value": 27
                        },
                        {
                              "label": "Referral",
                              "value": 18
                        },
                        {
                              "label": "Social",
                              "value": 12
                        }
                  ],
                  "ui:field": "template"
            },
            "orientation": {
                  "type": "object",
                  "title": "'vertical' | 'horizontal'",
                  "default": "vertical",
                  "ui:field": "template"
            },
            "title": {
                  "type": "object",
                  "title": "Heading",
                  "default": "Revenue by channel",
                  "ui:field": "template"
            },
            "max": {
                  "type": "object",
                  "title": "Force axis ceiling",
                  "ui:field": "template"
            },
            "color": {
                  "type": "object",
                  "title": "Single color for all bars",
                  "ui:field": "template"
            },
            "showValues": {
                  "type": "object",
                  "title": "Show value on each bar",
                  "default": true,
                  "ui:field": "template"
            },
            "valuePrefix": {
                  "type": "object",
                  "title": "Value prefix, e.g. $",
                  "default": "$",
                  "ui:field": "template"
            },
            "valueSuffix": {
                  "type": "object",
                  "title": "Value suffix, e.g. % or k",
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

export const BarChartNode = {
  definition,
  executor: BarChartExecutor,
};

export { createNodeDefinition as default };
