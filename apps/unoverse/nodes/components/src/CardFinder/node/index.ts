/**
 * CardFinder Node Definition
 * Auto-generated from Unoverse definition
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import CardFinderExecutor from "./executor";
import { loadDefaultTemplate } from "../service/templates";

export const NODE_TYPE = "CardFinder";

export function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "CardFinder",
    description: "An interactive card-recommendation finder: a guided questionnaire of eligibility and preference questions with a phase stepper and progress bar, an eligibility summary, then a best-fit result card — match score, card name and image, key benefits, annual fee, tier, and why-it-fits reasons — beside a hero image.",
    whenToUse: "Help a user find or choose the right card by answering a few eligibility and preference questions, then present a personalised best-fit recommendation with a match score and reasons. Pick when the outcome is a guided question-and-answer flow that ends in a single tailored recommendation.",
    category: "Design System",
    color: "#10b981",
    template: "uiComponent",
    componentTemplate: loadDefaultTemplate(),
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    nodeSize: { width: 1040, height: 760 },
    inputs: [{ name: "signal", type: NodeInputType.OBJECT, description: "Signal" }],
    outputs: [{ name: "componentSpec", type: NodeInputType.OBJECT, description: "Component spec for downstream nodes" }],
    configSchema: {
      "type": "object",
      "properties": {
            "recommendation": {
                  "type": "object",
                  "title": "recommendation",
                  "default": {
                        "matchScore": "95%",
                        "cardFamily": "Premium Travel",
                        "cardName": "SAB Emirates Infinite",
                        "cardDescription": "Premium travel card with Emirates Skywards miles and unlimited lounge access.",
                        "cardImage": "https://res.cloudinary.com/sonik/image/upload/v1767547655/SAB/ek-visa-472X296.png",
                        "feeValue": "750",
                        "tierValue": "Infinite",
                        "uiTags": [
                              {
                                    "label": "Travel"
                              },
                              {
                                    "label": "Miles"
                              },
                              {
                                    "label": "Lounge"
                              },
                              {
                                    "label": "Premium"
                              }
                        ],
                        "keyBenefits": [
                              {
                                    "label": "Earn Emirates Skywards miles on every spend"
                              },
                              {
                                    "label": "Unlimited airport lounge access worldwide"
                              },
                              {
                                    "label": "Comprehensive travel insurance included"
                              },
                              {
                                    "label": "Dedicated premium concierge service"
                              }
                        ],
                        "fitReasons": [
                              {
                                    "label": "Perfect match for Emirates Skywards miles earning"
                              },
                              {
                                    "label": "Unlimited lounge access for frequent travelers"
                              }
                        ],
                        "ctaNote": "Annual fee SAR 750 (without VAT) · Instant decision"
                  },
                  "ui:field": "template"
            },
            "eligibleTiers": {
                  "type": "array",
                  "title": "eligibleTiers",
                  "default": [
                        {
                              "label": "Premium Travel Cards"
                        },
                        {
                              "label": "Travel Essentials"
                        },
                        {
                              "label": "Cashback Cards"
                        }
                  ],
                  "ui:field": "template"
            },
            "heroImage": {
                  "type": "string",
                  "title": "heroImage",
                  "default": "https://res.cloudinary.com/sonik/image/upload/v1767543207/SAB/travel.jpg",
                  "ui:field": "template"
            }
      },
      "required": []
},
    credentials: [],
  };
}

const definition = createNodeDefinition();

export const CardFinderNode = {
  definition,
  executor: CardFinderExecutor,
};

export { createNodeDefinition as default };
