"use strict";
/**
 * KenBurnsImage Node Definition
 * Auto-generated from Storybook component
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KenBurnsImageNode = exports.NODE_TYPE = void 0;
exports.createNodeDefinition = createNodeDefinition;
exports.default = createNodeDefinition;
const plugin_base_1 = require("@gravity-platform/plugin-base");
const executor_1 = __importDefault(require("./executor"));
const templates_1 = require("../service/templates");
exports.NODE_TYPE = "KenBurnsImage";
function createNodeDefinition() {
    return {
        packageVersion: "0.2.4",
        type: exports.NODE_TYPE,
        name: "KenBurnsImage",
        description: "KenBurnsImage UI component from design system",
        category: "Design System",
        color: "#10b981",
        template: "uiComponent",
        componentTemplate: (0, templates_1.loadDefaultTemplate)(),
        logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
        inputs: [{ name: "signal", type: plugin_base_1.NodeInputType.OBJECT, description: "Signal" }],
        outputs: [{ name: "output", type: plugin_base_1.NodeInputType.OBJECT, description: "Response object" }],
        configSchema: {
            "type": "object",
            "properties": {
                "src": {
                    "type": "string",
                    "title": "Image source URL",
                    "default": "https://res.cloudinary.com/sonik/image/upload/v1761403583/gravity/YodaPark/starship.webp",
                    "ui:field": "template"
                },
                "alt": {
                    "type": "string",
                    "title": "Alt text for the image",
                    "default": "Starship in deep space",
                    "ui:field": "template"
                },
                "direction": {
                    "type": "string",
                    "title": "Direction of the zoom and pan movement",
                    "default": "topLeft",
                    "enum": [
                        "topLeft",
                        "topRight",
                        "bottomLeft",
                        "bottomRight",
                        "center"
                    ],
                    "enumNames": [
                        "Top Left",
                        "Top Right",
                        "Bottom Left",
                        "Bottom Right",
                        "Center"
                    ]
                },
                "scale": {
                    "type": "number",
                    "title": "Maximum zoom scale",
                    "default": 1.25,
                    "minimum": 1.05,
                    "maximum": 1.5,
                    "step": 0.05
                },
                "overlay": {
                    "type": "boolean",
                    "title": "Show gradient overlay",
                    "default": false,
                    "ui:widget": "toggle"
                },
                "grain": {
                    "type": "boolean",
                    "title": "Show grain texture",
                    "default": false,
                    "ui:widget": "toggle"
                },
                "particles": {
                    "type": "boolean",
                    "title": "Show floating particles",
                    "default": false,
                    "ui:widget": "toggle"
                }
            },
            "required": []
        },
        credentials: [],
    };
}
const definition = createNodeDefinition();
exports.KenBurnsImageNode = {
    definition,
    executor: executor_1.default,
};
