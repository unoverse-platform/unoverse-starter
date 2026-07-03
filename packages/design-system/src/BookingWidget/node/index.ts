/**
 * BookingWidget Node Definition
 * Auto-generated from Storybook component
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import BookingWidgetExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "BookingWidget";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "BookingWidget",
    description: "Structured booking card showing travel/reservation details with confirm, edit, and cancel actions.",
    whenToUse: "Pick when presenting a concrete booking or reservation the user confirms or edits. For free-form AI answers use AIResponse; for plain documents use MarkdownRenderer.",
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

export const BookingWidgetNode = {
  definition,
  executor: BookingWidgetExecutor,
};

export { createNodeDefinition as default };
