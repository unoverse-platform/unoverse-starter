/**
 * Suggestions Node Definition
 * Publishes FAQs, Actions, and Recommendations to the client state
 */

import { getPlatformDependencies, type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import SuggestionsExecutor from "./executor";

// Export node type constant
export const NODE_TYPE = "Suggestions";

// Export a function that creates the definition after platform deps are set
export function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.1.1",
    type: NODE_TYPE,
    isService: false,
    name: "Suggestions",
    description: "Publish FAQs, Actions, and Recommendations to the client UI",
    whenToUse: "Push suggested FAQs, quick actions, and recommendations to the live client chat UI so the user sees clickable follow-up chips. The dedicated path for chat suggestions — sends a typed SUGGESTIONS_UPDATE frame from the input signal or static config; a generic object push won't render as suggestion chips.",
    category: "Output",
    color: "#8B5CF6", // Purple for suggestions/AI
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",

    inputs: [
      {
        name: "signal",
        type: NodeInputType.ANY,
        description: "Signal containing suggestions data",
      },
    ],

    outputs: [
      {
        name: "suggestions",
        type: NodeInputType.OBJECT,
        description: "The suggestions object that was published",
      },
    ],

    configSchema: {
      type: "object",
      properties: {
        faqs: {
          type: "object",
          title: "FAQs",
          description: "Static FAQs (can be overridden by input)",
          "ui:field": "template",
        },
        actions: {
          type: "object",
          title: "Actions",
          description: "Static Actions (can be overridden by input)",
          "ui:field": "template",
        },
        recommendations: {
          type: "object",
          title: "Recommendations",
          description: "Static Recommendations (can be overridden by input)",
          "ui:field": "template",
        },
      },
      required: [],
    },
    // Sample for the workbench "Load sample" button. faqs/actions/recommendations are
    // template fields the engine resolves before run; the bench has no resolver, so
    // supply resolved arrays. Without a live WebSocket the node still returns the
    // assembled suggestions object on its output.
    testData: {
      config: {
        faqs: [{ id: "1", question: "What can you help with?" }],
        actions: [],
        recommendations: [{ id: "r1", text: "Try the onboarding flow", confidence: 0.9 }],
      },
      inputs: { signal: { trigger: true } },
    },
  };
}

// Export as enhanced node
export const SuggestionsNode = {
  definition: createNodeDefinition(),
  executor: SuggestionsExecutor,
};

// Export for node registry
export const definition = createNodeDefinition();
