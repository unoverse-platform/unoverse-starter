"use strict";
/**
 * AccountTransferWidget Node Definition
 * Auto-generated from Storybook component
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountTransferWidgetNode = exports.NODE_TYPE = void 0;
exports.createNodeDefinition = createNodeDefinition;
exports.default = createNodeDefinition;
const plugin_base_1 = require("@gravity-platform/plugin-base");
const executor_1 = __importDefault(require("./executor"));
const templates_1 = require("../service/templates");
exports.NODE_TYPE = "AccountTransferWidget";
function createNodeDefinition() {
    return {
        packageVersion: "1.0.0",
        type: exports.NODE_TYPE,
        name: "AccountTransferWidget",
        description: "AccountTransferWidget UI component from design system",
        category: "Design System",
        color: "#10b981",
        template: "uiComponent",
        componentTemplate: (0, templates_1.loadDefaultTemplate)(),
        logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
        nodeSize: { width: 900, height: 600 },
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
                "transferData": {
                    "type": "object",
                    "title": "Transfer data object populated by AI",
                    "ui:field": "template"
                },
                "availableAccounts": {
                    "type": "object",
                    "title": "Available source accounts to choose from",
                    "ui:field": "template"
                },
                "beneficiaries": {
                    "type": "object",
                    "title": "Saved beneficiaries to choose from",
                    "ui:field": "template"
                },
                "heroImage": {
                    "type": "string",
                    "title": "Hero image URL for the widget",
                    "ui:field": "template"
                }
            },
            "required": []
        },
        credentials: [],
    };
}
const definition = createNodeDefinition();
exports.AccountTransferWidgetNode = {
    definition,
    executor: executor_1.default,
};
