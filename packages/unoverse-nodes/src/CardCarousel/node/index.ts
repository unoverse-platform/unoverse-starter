/**
 * CardCarousel Node Definition
 * Auto-generated from Unoverse definition
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import CardCarouselExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "CardCarousel";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "CardCarousel",
    description: "A horizontally scrollable row of image + title + description + call-to-action cards, one per item.",
    whenToUse: "Show a set of items — offers, products, services, results — as a horizontally scrollable row of cards the viewer swipes through, each with an image, title, short description and a call-to-action. Pick when several comparable items should be browsed side by side rather than a single one in isolation.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 820, height: 440 },
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "componentSpec", type: NodeInputType.OBJECT, description: "Component spec for downstream nodes" }],
    configSchema: {
      "type": "object",
      "properties": {
            "items": {
                  "type": "array",
                  "title": "items",
                  "default": [
                        {
                              "title": "SAB Emirates Infinite Credit Card",
                              "description": "Earn Emirates Skywards Miles on your everyday spending and enjoy premium travel and lifestyle privileges.",
                              "image": "https://res.cloudinary.com/sonik/image/upload/v1764906939/bankStock/1248X400-center.jpg",
                              "callToAction": "Apply Now"
                        },
                        {
                              "title": "Premium Cashback Card",
                              "description": "Get up to 5% cashback on all your purchases with no annual fee for the first year.",
                              "image": "https://res.cloudinary.com/sonik/image/upload/v1758796390/bankStock/benefits-of-using-credit-card-for-travelling.jpg",
                              "callToAction": "Get Started"
                        },
                        {
                              "title": "Travel Rewards Plus",
                              "description": "Unlock exclusive travel benefits, airport lounge access, and travel insurance coverage.",
                              "image": "https://res.cloudinary.com/sonik/image/upload/v1758796390/bankStock/what-are-travel-cards-717x404.webp",
                              "callToAction": "Explore Benefits"
                        }
                  ]
            },
            "object": {
                  "type": "object",
                  "title": "Full object with CardCarousel data (items)",
                  "ui:field": "template"
            }
      },
      "required": []
},
    credentials: [],
  };
}

const definition = createNodeDefinition();

export const CardCarouselNode = {
  definition,
  executor: CardCarouselExecutor,
};

export { createNodeDefinition as default };
