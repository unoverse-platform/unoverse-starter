import {
  getPlatformDependencies,
  type EnhancedNodeDefinition,
} from "@unoverse-platform/plugin-base";
import SlackMCPExecutor from "./executor";

export const NODE_TYPE = "SlackMCP";

function createNodeDefinition(): EnhancedNodeDefinition {
  const { NodeInputType } = getPlatformDependencies();

  return {
    packageVersion: "1.0.0",
    type: NODE_TYPE,
    name: "Slack",
    description:
      "Send messages, search conversations, list channels, look up users, and read history in Slack. Exposes send_message, list_channels, search_messages, get_user, read_history, add_reaction as MCP tools.",
    whenToUse: "Post messages or otherwise act in Slack — send or thread-reply a message, search conversations, list channels, look up a user, read recent history, or add an emoji reaction in a Slack workspace (not an email inbox or the client UI). Attach via a service edge to an agent node.",
    category: "Communication",
    color: "#4A154B",
    template: "service",
    logoUrl: "https://res.cloudinary.com/sonik/image/upload/v1779530623/gravity/icons/Slack.svg",
    inputs: [
      {
        name: "input",
        type: NodeInputType.OBJECT,
        description: "Trigger input for workflow-driven execution",
      },
    ],
    outputs: [
      {
        name: "output",
        type: NodeInputType.OBJECT,
        description: "API response from the executed Slack operation",
      },
    ],
    serviceConnectors: [
      {
        name: "mcpService",
        description:
          "MCP tools for agents to interact with Slack: send messages, search, list channels, look up users, read history, add reactions",
        serviceType: "mcp",
        methods: [
          "send_message",
          "list_channels",
          "search_messages",
          "get_user",
          "read_history",
          "add_reaction",
        ],
        isService: true,
      },
    ],
    configSchema: {
      type: "object",
      properties: {
        defaultChannel: {
          type: "string",
          title: "Default Channel",
          description:
            "Channel ID used when the workflow triggers this node directly (not required for MCP tool calls)",
          default: "",
          "ui:field": "template",
        },
      },
      required: [],
    },
    credentials: [
      { name: "slackBotToken", required: true },
    ],
    capabilities: { isTrigger: false },
  };
}

const definition = createNodeDefinition();

export const SlackMCPNode = {
  definition,
  executor: SlackMCPExecutor,
};

export { createNodeDefinition };
