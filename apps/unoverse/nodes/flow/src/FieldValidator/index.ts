/**
 * FieldValidator Node Definition
 * Validates incoming data against required schema and outputs next missing field
 * 
 * Use Case: Power automatic user questions by identifying missing fields
 * Example: Schema with required: ["email", "phone"], data has {name: "John"}
 *          → Outputs "email" as next missing field (required fields prioritized)
 * 
 * Priority: 1) Fields in "required" array first, 2) Then schema property order
 */

import { NodeInputType, type EnhancedNodeDefinition } from "@unoverse-platform/plugin-base";
import FieldValidatorExecutor from "./executor";

// Export node type constant
export const NODE_TYPE = "FieldValidator";

// Create node definition
function createNodeDefinition(): EnhancedNodeDefinition {
  return {
    packageVersion: "1.1.1",
    type: NODE_TYPE,
    isService: false,
    name: "Field Validator",
    description: "Validate data against schema and output next missing field",
    whenToUse: "Validate an incoming data object against a required schema and get the next missing field to ask for — drives progressive form-filling / slot-filling conversations. Deterministically returns the next field and completion state, prioritizing the schema's required fields then property order, so the dialog never relies on an LLM to decide what to ask next.",
    category: "Flow",
    color: "#8b5cf6", // Purple color for validation/logic
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1750052178/gravity/icons/6359572-200.png",
    inputs: [
      {
        name: "signal",
        type: NodeInputType.OBJECT,
        description: "Incoming data object to validate",
      },
    ],
    outputs: [
      { name: "nextField", type: NodeInputType.STRING, description: "Next missing field name" },
      { name: "nextFieldSchema", type: NodeInputType.OBJECT, description: "Schema definition for next field" },
      { name: "missingFields", type: NodeInputType.ARRAY, description: "All missing fields" },
      { name: "isComplete", type: NodeInputType.BOOLEAN, description: "All fields present" },
      { name: "completionPercentage", type: NodeInputType.NUMBER, description: "Data coverage %" },
    ],
    // Schema for the node configuration UI
    configSchema: {
      type: "object",
      properties: {
        requiredSchema: {
          type: "object",
          title: "Required Schema",
          description: "Schema defining required fields. Supports: 1) Tool schema format (inputSchema.json.properties), 2) JSON Schema (properties), 3) Direct object. Example: return signal.toolSchema",
          default: "",
          "ui:field": "template",
        },
        incomingData: {
          type: "object",
          title: "Incoming Data",
          description: "Data object to validate. Use: return signal.data or return input.formData",
          default: "",
          "ui:field": "template",
        },
      },
      required: ["requiredSchema", "incomingData"],
    },
    // Declare capabilities
    capabilities: {
      isTrigger: false,
    },
    // Sample for the workbench "Load sample" button. `requiredSchema`/`incomingData`
    // are template fields the engine resolves before run; the bench has no resolver,
    // so supply already-resolved objects. Here email+phone are required and only name
    // is filled → nextField "email", missingFields ["email","phone"], ~33% complete.
    testData: {
      config: {
        requiredSchema: {
          properties: { name: { type: "string" }, email: { type: "string" }, phone: { type: "string" } },
          required: ["email", "phone"],
        },
        incomingData: { name: "Ada" },
      },
      inputs: { signal: { name: "Ada" } },
    },
  };
}

// Export as enhanced node
export const FieldValidatorNode = {
  definition: createNodeDefinition(),
  executor: FieldValidatorExecutor,
};

// Export for node registry
export const definition = createNodeDefinition();
