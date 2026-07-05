/**
 * AIResponse Node Definition
 * Auto-generated from Unoverse definition
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import AIResponseExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "AIResponse";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "AIResponse",
    description: "Streaming conversational AI answer: markdown body (tables, links, images) plus an optional thinking/progress line.",
    whenToUse: "Default for chat-style AI replies that stream token-by-token. For a static rendered document or report use MarkdownRenderer; for a structured booking confirmation use BookingWidget.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 750, height: 400 },
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "componentSpec", type: NodeInputType.OBJECT, description: "Component spec for downstream nodes" }],
    configSchema: {
      "type": "object",
      "properties": {
            "thinking": {
                  "type": "string",
                  "title": "thinking",
                  "default": "",
                  "ui:field": "template"
            },
            "text": {
                  "type": "string",
                  "title": "text",
                  "default": "## How can I help?\n\nThis is an **AI response** rendered from _markdown_ — it streams in token by token and supports rich formatting:\n\n- **Lists** and `inline code`\n- [Links](https://example.com) that open in a new tab\n- Tables and images\n\n| Feature | Supported |\n| --- | --- |\n| Markdown body | ✅ |\n| Streaming | ✅ |\n",
                  "ui:field": "template"
            },
            "questions": {
                  "type": "object",
                  "title": "questions",
                  "default": [],
                  "ui:field": "template"
            }
      },
      "required": []
},
    credentials: [],
  };
}

const definition = createNodeDefinition();

export const AIResponseNode = {
  definition,
  executor: AIResponseExecutor,
};

export { createNodeDefinition as default };
