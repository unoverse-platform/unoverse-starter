import {
  getPlatformDependencies,
  type EnhancedNodeDefinition,
} from "@unoverse-platform/plugin-base";
import SalesforceMCPExecutor from "./executor";

export const NODE_TYPE = "SalesforceMCP";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Salesforce",
    description:
      "Query with SOQL, read/create/update records, and inspect object metadata in a Salesforce org. Exposes query_records, get_record, create_record, update_record, describe_object, list_objects as MCP tools.",
    whenToUse:
      "Pick for customer and CRM data in Salesforce — look up customers, accounts, contacts, leads and opportunities, and create or update those records. A real Salesforce CRM client (SOQL under the hood), not hand-built REST; attach it via a service edge to an agent, or trigger it directly with a fixed query.",
    category: "Go To Market",
    color: "#00A1E0",
    template: "service",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1781672225/gravity/icons/Salesforce-dark.svg",
    inputs: [
      {
        name: "input",
        type: NodeInputType.OBJECT,
        description: "Trigger input for workflow-driven execution (optionally { soql })",
      },
    ],
    outputs: [
      {
        name: "output",
        type: NodeInputType.OBJECT,
        description: "Result of the executed Salesforce operation",
      },
    ],
    serviceConnectors: [
      {
        name: "mcpService",
        description:
          "MCP tools for agents to interact with Salesforce: SOQL queries, read/create/update records, describe objects, list objects",
        serviceType: "mcp",
        methods: [
          "query_records",
          "get_record",
          "create_record",
          "update_record",
          "describe_object",
          "list_objects",
          // CRM Sync contract — see CRM_SYNC.md
          "crm_resolve_user",
          "crm_get_profile",
          "crm_write_insight",
          "crm_read_insights",
        ],
        isService: true,
      },
    ],
    configSchema: {
      type: "object",
      properties: {
        syncUser: {
          type: "boolean",
          title: "Sync user on trigger",
          description:
            "When triggered (wire off the conversation trigger), deterministically resolve the authenticated user against the CRM and refresh the cached snapshot — cache-aside, so it only hits Salesforce when the snapshot is cold (first seen or 10-min TTL expired). No agent involved. Leave off for plain SOQL execution.",
          default: false,
          "ui:widget": "toggle",
        },
        defaultQuery: {
          type: "string",
          title: "Default SOQL Query",
          description:
            "SOQL query run when the workflow triggers this node directly (not used for MCP tool calls or when Sync user is on). e.g. SELECT Id, Name FROM Account LIMIT 10",
          default: "",
          "ui:field": "template",
          "ui:dependencies": { syncUser: false },
        },
      },
      required: [],
    },
    credentials: [{ name: "salesforceOAuth", required: true }],
    capabilities: { isTrigger: false },
  };
}

const definition = createNodeDefinition();

export const SalesforceMCPNode = {
  definition,
  executor: SalesforceMCPExecutor,
};

export { createNodeDefinition };
