/**
 * ProgressRing Node Definition
 * Auto-generated from Storybook component
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import ProgressRingExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "ProgressRing";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "ProgressRing",
    description: "Radial gauge / donut showing a value as a filled arc of a circle, with a big center figure and caption. Reads as progress toward a goal or a share of a whole.",
    whenToUse: "Use for PROGRESS TOWARD A GOAL or a single proportion/percentage (quota attainment, utilization, completion). For a raw number use StatCard; for category comparison use BarChart; for change over time use TrendChart.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 280, height: 300 },
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
            "value": {
                  "type": "object",
                  "title": "Current value",
                  "default": 48,
                  "ui:field": "template"
            },
            "max": {
                  "type": "object",
                  "title": "Value that fills the ring (default 100)",
                  "default": 60,
                  "ui:field": "template"
            },
            "label": {
                  "type": "object",
                  "title": "Metric name under the ring",
                  "default": "Quarterly target",
                  "ui:field": "template"
            },
            "centerValue": {
                  "type": "object",
                  "title": "Override big center text (default: percent)",
                  "default": "$48k",
                  "ui:field": "template"
            },
            "centerLabel": {
                  "type": "object",
                  "title": "Small caption under the center value",
                  "default": "of $60k goal",
                  "ui:field": "template"
            },
            "color": {
                  "type": "object",
                  "title": "Progress arc color",
                  "default": "var(--color-chart-1)",
                  "ui:field": "template"
            },
            "trackColor": {
                  "type": "object",
                  "title": "Unfilled track color",
                  "ui:field": "template"
            },
            "thickness": {
                  "type": "object",
                  "title": "Stroke thickness (viewBox units)",
                  "default": 12,
                  "ui:field": "template"
            }
      },
      "required": []
},
    credentials: [],
  };
}

const definition = createNodeDefinition();

export const ProgressRingNode = {
  definition,
  executor: ProgressRingExecutor,
};

export { createNodeDefinition as default };
