import { NodeInputType, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import SendObjectExecutor from "./executor";

export const NODE_TYPE = "SendObject";

function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Send Object",
    description: "Send JSON data to client with an ID for identification",
    whenToUse: "Deliver an arbitrary JSON payload to the live client UI / state store, keyed by an ID, for client code or components to consume over the user's WebSocket. The destination is the CLIENT APP itself (not an email inbox, not a chat channel, not a typed chat quick-reply). It renders nothing on canvas — use a design-system display node for visible output.",
    category: "Output",
    color: "#10B981",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1751366180/gravity/icons/gravityIcon.png",
    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Trigger signal (optional)",
      },
    ],
    outputs: [
      {
        name: "output",
        type: NodeInputType.OBJECT,
        description: "Data with storageKey and id for client-side storage",
      },
    ],
    configSchema: {
      type: "object",
      required: ["data"],
      properties: {
        data: {
          type: "object",
          title: "Data",
          description: "JSON data to send to client. Supports template syntax: {{signal.fieldName}}",
          default: {},
          "ui:field": "template",
        },
        objectId: {
          type: "string",
          title: "Object ID (optional)",
          description: "Optional custom ID. If not provided, uses node ID.",
          default: "",
          "ui:field": "template",
        },
      },
    },
    capabilities: {
      isTrigger: false,
    },
    // Sample for the workbench "Load sample" button. `data`/`objectId` are template
    // fields the engine resolves before run; the bench has no resolver, so supply a
    // resolved object. Without a live WebSocket the node still returns {id, data}.
    testData: {
      config: { data: { title: "Lead summary", score: 87 }, objectId: "sample-object" },
      inputs: { signal: { trigger: true } },
    },
  };
}

const definition = createNodeDefinition();

export const SendObjectNode = {
  definition,
  executor: SendObjectExecutor,
};

export { createNodeDefinition };
