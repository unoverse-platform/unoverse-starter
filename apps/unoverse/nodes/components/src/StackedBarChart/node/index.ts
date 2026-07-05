/**
 * StackedBarChart Node Definition
 * Auto-generated from Unoverse definition
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import StackedBarChartExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "StackedBarChart";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "StackedBarChart",
    description: "Stacked bar chart showing composition per category. Composed from a nested Box + Each (no chart primitive): each bar stacks segments whose heights bind to producer-supplied proportions ({{pct}}) and whose colours are served tokens bound per segment ({{color}}). A legend maps colours to series.",
    whenToUse: "Show how a total breaks down into parts across categories — revenue by product per quarter, traffic by channel per week. Pick when each bar is a composition of sub-parts that should sum visually, rather than single values (plain bar chart) or a ranked list.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 560, height: 400 },
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "componentSpec", type: NodeInputType.OBJECT, description: "Component spec for downstream nodes" }],
    configSchema: {
      "type": "object",
      "properties": {
            "title": {
                  "type": "string",
                  "title": "title",
                  "default": "Revenue by product",
                  "ui:field": "template"
            },
            "series": {
                  "type": "array",
                  "title": "series",
                  "default": [
                        {
                              "label": "Product A",
                              "color": "action.primary"
                        },
                        {
                              "label": "Product B",
                              "color": "status.info"
                        },
                        {
                              "label": "Product C",
                              "color": "status.warning"
                        }
                  ],
                  "ui:field": "template"
            },
            "bars": {
                  "type": "array",
                  "title": "bars",
                  "default": [
                        {
                              "label": "Q1",
                              "segments": [
                                    {
                                          "pct": "15%",
                                          "color": "status.warning"
                                    },
                                    {
                                          "pct": "25%",
                                          "color": "status.info"
                                    },
                                    {
                                          "pct": "30%",
                                          "color": "action.primary"
                                    }
                              ]
                        },
                        {
                              "label": "Q2",
                              "segments": [
                                    {
                                          "pct": "20%",
                                          "color": "status.warning"
                                    },
                                    {
                                          "pct": "30%",
                                          "color": "status.info"
                                    },
                                    {
                                          "pct": "40%",
                                          "color": "action.primary"
                                    }
                              ]
                        },
                        {
                              "label": "Q3",
                              "segments": [
                                    {
                                          "pct": "20%",
                                          "color": "status.warning"
                                    },
                                    {
                                          "pct": "25%",
                                          "color": "status.info"
                                    },
                                    {
                                          "pct": "35%",
                                          "color": "action.primary"
                                    }
                              ]
                        },
                        {
                              "label": "Q4",
                              "segments": [
                                    {
                                          "pct": "20%",
                                          "color": "status.warning"
                                    },
                                    {
                                          "pct": "35%",
                                          "color": "status.info"
                                    },
                                    {
                                          "pct": "45%",
                                          "color": "action.primary"
                                    }
                              ]
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

export const StackedBarChartNode = {
  definition,
  executor: StackedBarChartExecutor,
};

export { createNodeDefinition as default };
