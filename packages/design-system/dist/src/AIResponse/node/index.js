"use strict";
/**
 * AIResponse Node Definition
 * Auto-generated from Storybook component
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIResponseNode = exports.NODE_TYPE = void 0;
exports.createNodeDefinition = createNodeDefinition;
exports.default = createNodeDefinition;
const plugin_base_1 = require("@gravity-platform/plugin-base");
const executor_1 = __importDefault(require("./executor"));
const templates_1 = require("../service/templates");
exports.NODE_TYPE = "AIResponse";
function createNodeDefinition() {
    return {
        packageVersion: "1.0.0",
        type: exports.NODE_TYPE,
        name: "AIResponse",
        description: "AIResponse UI component from design system",
        category: "Design System",
        color: "#10b981",
        template: "uiComponent",
        componentTemplate: (0, templates_1.loadDefaultTemplate)(),
        logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
        nodeSize: { width: 750, height: 400 },
        inputs: [{ name: "signal", type: plugin_base_1.NodeInputType.OBJECT, description: "Signal" }],
        outputs: [{ name: "output", type: plugin_base_1.NodeInputType.OBJECT, description: "Response object" }],
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
                "progressText": {
                    "type": "string",
                    "title": "Progress/thinking message",
                    "default": "Searching the Jedi Archives...",
                    "ui:field": "template"
                },
                "text": {
                    "type": "object",
                    "title": "Main response text",
                    "default": "The **Star Wars** saga spans nine main films across three trilogies, following the Skywalker family's journey through the galaxy. From Anakin's fall to the **dark side** to Luke's redemption of his father, and Rey's discovery of her own power, these stories explore themes of **hope**, **redemption**, and the eternal struggle between light and dark.",
                    "ui:field": "template"
                },
                "questions": {
                    "type": "object",
                    "title": "Follow-up questions (array of strings)",
                    "default": [
                        "What is the correct chronological order to watch all Star Wars films?",
                        "Who are the most powerful Jedi in Star Wars history?",
                        "What is the difference between the light side and dark side of the Force?"
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
exports.AIResponseNode = {
    definition,
    executor: executor_1.default,
};
