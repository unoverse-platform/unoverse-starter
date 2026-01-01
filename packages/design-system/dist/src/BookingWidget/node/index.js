"use strict";
/**
 * BookingWidget Node Definition
 * Auto-generated from Storybook component
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingWidgetNode = exports.NODE_TYPE = void 0;
exports.createNodeDefinition = createNodeDefinition;
exports.default = createNodeDefinition;
const plugin_base_1 = require("@gravity-platform/plugin-base");
const executor_1 = __importDefault(require("./executor"));
const templates_1 = require("../service/templates");
exports.NODE_TYPE = "BookingWidget";
function createNodeDefinition() {
    return {
        packageVersion: "1.0.0",
        type: exports.NODE_TYPE,
        name: "BookingWidget",
        description: "BookingWidget UI component from design system",
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
                "bookingData": {
                    "type": "object",
                    "title": "Booking information to display",
                    "default": {
                        "service": "Jedi Training Session",
                        "serviceDescription": "Advanced lightsaber combat techniques and Force meditation. Master Yoda will guide you through ancient Jedi practices and help strengthen your connection to the Force.",
                        "serviceImage": "https://res.cloudinary.com/sonik/image/upload/v1761403583/gravity/YodaPark/force.avif",
                        "therapist": "Master Yoda",
                        "date": "2025-05-04",
                        "time": "14:00",
                        "duration": "90 minutes",
                        "patientName": "Luke Skywalker",
                        "email": "luke@rebelalliance.org",
                        "phone": "+1 (555) FORCE-01",
                        "notes": "Seeking guidance in the ways of the Force. Previous training with Obi-Wan.",
                        "price": "500 Credits",
                        "status": "pending"
                    },
                    "ui:field": "template"
                }
            },
            "required": []
        },
        credentials: [],
    };
}
const definition = createNodeDefinition();
exports.BookingWidgetNode = {
    definition,
    executor: executor_1.default,
};
