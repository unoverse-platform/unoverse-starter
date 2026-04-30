/**
 * MarkdownRenderer Node Definition
 * Auto-generated from Storybook component
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import MarkdownRendererExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "MarkdownRenderer";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "MarkdownRenderer",
    description: "MarkdownRenderer UI component from design system",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 750, height: 500 },
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
            "title": {
                  "type": "string",
                  "title": "Optional title shown above the rendered markdown",
                  "ui:field": "template"
            },
            "markdown": {
                  "type": "string",
                  "title": "Markdown content to render",
                  "ui:field": "template"
            },
            "streamingState": {
                  "type": "string",
                  "title": "Controls the 'Writing…' indicator",
                  "default": "idle",
                  "enum": [
                        "idle",
                        "streaming",
                        "complete"
                  ],
                  "enumNames": [
                        "Idle",
                        "Streaming",
                        "Complete"
                  ]
            }
      },
      "required": []
},
    credentials: [],
  };
}

const definition = createNodeDefinition();

export const MarkdownRendererNode = {
  definition,
  executor: MarkdownRendererExecutor,
};

export { createNodeDefinition as default };
