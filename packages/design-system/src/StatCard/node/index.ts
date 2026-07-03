/**
 * StatCard Node Definition
 * Auto-generated from Storybook component
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
    description: "Single KPI tile: a large headline value with prefix/suffix, an up/down delta vs the prior period (auto-colored green/red), an optional inline sparkline, an icon and a caption.",
    whenToUse: "Use for ONE headline metric. For several KPIs side-by-side use MetricGrid; for a metric over time use TrendChart; for category comparison use BarChart; for progress toward a goal use ProgressRing.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 320, height: 200 },
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
            "label": {
                  "type": "object",
                  "title": "Metric name",
                  "default": "Monthly Revenue",
                  "ui:field": "template"
            },
            "value": {
                  "type": "object",
                  "title": "Headline value (string or number)",
                  "default": "48,250",
                  "ui:field": "template"
            },
            "prefix": {
                  "type": "object",
                  "title": "Value prefix, e.g. $",
                  "default": "$",
                  "ui:field": "template"
            },
            "suffix": {
                  "type": "object",
                  "title": "Value suffix, e.g. % or ms",
                  "ui:field": "template"
            },
            "delta": {
                  "type": "object",
                  "title": "Change: { value, direction: 'up'|'down'|'neutral', label }",
                  "default": {
                        "value": "12.4%",
                        "direction": "up",
                        "label": "vs last month"
                  },
                  "ui:field": "template"
            },
            "invertDelta": {
                  "type": "object",
                  "title": "When true a downward delta is good (cost, churn, latency)",
                  "ui:field": "template"
            },
            "sparkline": {
                  "type": "object",
                  "title": "Trend series (array of numbers)",
                  "default": [
                        28,
                        31,
                        30,
                        34,
                        33,
                        39,
                        41,
                        44,
                        43,
                        48
                  ],
                  "ui:field": "template"
            },
            "icon": {
                  "type": "object",
                  "title": "Leading glyph (emoji / 1–2 chars)",
                  "default": "💰",
                  "ui:field": "template"
            },
            "caption": {
                  "type": "object",
                  "title": "Muted helper line",
                  "default": "Updated 2m ago",
                  "ui:field": "template"
            },
            "accentColor": {
                  "type": "object",
                  "title": "Accent CSS color for icon + sparkline",
                  "default": "var(--color-chart-1)",
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
