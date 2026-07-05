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
                              "title": "Aurora Expedition",
                              "description": "Chase the northern lights across the Arctic circle with expert guides and glass-roofed lodges.",
                              "image": "https://picsum.photos/seed/aurora/800/400",
                              "callToAction": "Book Now"
                        },
                        {
                              "title": "Desert Stargazing",
                              "description": "A night under the clearest skies on earth, with telescopes, storytelling and campfire dining.",
                              "image": "https://picsum.photos/seed/desert/800/400",
                              "callToAction": "Get Started"
                        },
                        {
                              "title": "Coastal Trail Walk",
                              "description": "Three days of cliff-top paths, hidden coves and fishing-village stays on the Atlantic coast.",
                              "image": "https://picsum.photos/seed/coast/800/400",
                              "callToAction": "Explore"
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

export const CardCarouselNode = {
  definition,
  executor: CardCarouselExecutor,
};

export { createNodeDefinition as default };
