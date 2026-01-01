"use strict";
/**
 * Card2 Node Definition
 * Auto-generated from Storybook component
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card2Node = exports.NODE_TYPE = void 0;
exports.createNodeDefinition = createNodeDefinition;
exports.default = createNodeDefinition;
const plugin_base_1 = require("@gravity-platform/plugin-base");
const executor_1 = __importDefault(require("./executor"));
const templates_1 = require("../service/templates");
exports.NODE_TYPE = "Card2";
function createNodeDefinition() {
    return {
        packageVersion: "1.0.0",
        type: exports.NODE_TYPE,
        name: "Card2",
        description: "Card2 UI component from design system",
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
                "title": {
                    "type": "string",
                    "title": "Card title",
                    "default": "Force Sensitivity Assessment",
                    "ui:field": "template"
                },
                "description": {
                    "type": "string",
                    "title": "Card description text",
                    "default": "Discover your connection to the Force with advanced midi-chlorian analysis. Receive personalized training recommendations and track your progress on the path to becoming a Jedi.",
                    "ui:field": "template"
                },
                "image": {
                    "type": "string",
                    "title": "URL for card image",
                    "default": "https://res.cloudinary.com/sonik/image/upload/v1761403583/gravity/YodaPark/force.avif",
                    "ui:field": "template"
                },
                "callToAction": {
                    "type": "string",
                    "title": "Call to action button text",
                    "default": "Start Assessment",
                    "ui:field": "template"
                },
                "object": {
                    "type": "object",
                    "title": "Full object with card data (title, description, imageUrl/image, callToAction)",
                    "ui:field": "template"
                }
            },
            "required": []
        },
        credentials: [],
    };
}
const definition = createNodeDefinition();
exports.Card2Node = {
    definition,
    executor: executor_1.default,
};
