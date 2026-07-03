/**
 * MetricGrid Node Definition
 * Auto-generated from Storybook component
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
    description: "Responsive grid of KPI tiles — each with label, value (prefix/suffix), and an auto-colored up/down delta. The summary strip at the top of a dashboard.",
    whenToUse: "Use when showing SEVERAL headline KPIs together. For a single metric use StatCard; for a metric over time use TrendChart; for category comparison use BarChart; for progress toward a goal use ProgressRing.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 820, height: 240 },
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
            "metrics": {
                  "type": "object",
                  "title": "Array of { label, value, prefix, suffix, delta, invertDelta, icon, accentColor }",
                  "default": [
                        {
                              "label": "Revenue",
                              "value": "48,250",
                              "prefix": "$",
                              "delta": {
                                    "value": "12.4%",
                                    "direction": "up",
                                    "label": "MoM"
                              },
                              "icon": "💰",
                              "accentColor": "var(--color-chart-1)"
                        },
                        {
                              "label": "New Customers",
                              "value": "312",
                              "delta": {
                                    "value": "5.1%",
                                    "direction": "up",
                                    "label": "MoM"
                              },
                              "icon": "👥",
                              "accentColor": "var(--color-chart-2)"
                        },
                        {
                              "label": "Churn",
                              "value": "2.3",
                              "suffix": "%",
                              "invertDelta": true,
                              "delta": {
                                    "value": "-0.4pp",
                                    "direction": "down",
                                    "label": "MoM"
                              },
                              "icon": "📉",
                              "accentColor": "var(--color-chart-3)"
                        },
                        {
                              "label": "Avg Order Value",
                              "value": "154",
                              "prefix": "$",
                              "delta": {
                                    "value": "0%",
                                    "direction": "neutral",
                                    "label": "flat"
                              },
                              "icon": "🛒",
                              "accentColor": "var(--color-chart-4)"
                        }
                  ],
                  "ui:field": "template"
            },
            "title": {
                  "type": "object",
                  "title": "Optional heading above the grid",
                  "default": "This month at a glance",
                  "ui:field": "template"
            },
            "columns": {
                  "type": "object",
                  "title": "Fixed column count (omit for responsive)",
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
