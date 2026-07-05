export const SlackMCPSchema = {
  name: "Slack",
  version: "1.0.0",
  description:
    "Interact with a Slack workspace: send messages, search content, list channels, look up users, read history, and react to messages. All methods require a configured Slack Bot Token credential.",
  methods: {
    send_message: {
      description:
        "Send a message to a Slack channel or thread. Use channel ID (not name). To reply in a thread, provide thread_ts.",
      input: {
        type: "object",
        properties: {
          channel: { type: "string", description: "Channel ID (e.g. C01ABC123)" },
          text: { type: "string", description: "Message text (supports mrkdwn formatting)" },
          thread_ts: { type: "string", description: "Thread timestamp to reply to (optional)" },
        },
        required: ["channel", "text"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          ts: { type: "string", description: "Timestamp of the posted message" },
          channel: { type: "string" },
        },
      },
    },

    list_channels: {
      description:
        "List public channels in the workspace. Returns up to 200 channels with name, id, topic, and member count.",
      input: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max channels to return (default 100, max 200)", default: 100 },
          cursor: { type: "string", description: "Pagination cursor from a previous response (optional)" },
        },
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          channels: { type: "array" },
          has_more: { type: "boolean" },
          next_cursor: { type: "string" },
        },
      },
    },

    search_messages: {
      description:
        "Search for messages matching a query string. Returns messages with channel context and timestamps.",
      input: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query (supports Slack search syntax: in:#channel, from:@user, etc.)" },
          count: { type: "number", description: "Number of results to return (default 20, max 100)", default: 20 },
        },
        required: ["query"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          messages: { type: "object" },
        },
      },
    },

    get_user: {
      description:
        "Look up a Slack user by their user ID or email address. Returns profile info including display name, email, and status.",
      input: {
        type: "object",
        properties: {
          user_id: { type: "string", description: "User ID (e.g. U01ABC123). Provide this OR email." },
          email: { type: "string", description: "User email address. Provide this OR user_id." },
        },
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          user: { type: "object" },
        },
      },
    },

    read_history: {
      description:
        "Fetch recent messages from a channel. Returns messages in reverse chronological order (newest first).",
      input: {
        type: "object",
        properties: {
          channel: { type: "string", description: "Channel ID" },
          limit: { type: "number", description: "Number of messages to return (default 25, max 100)", default: 25 },
          oldest: { type: "string", description: "Only messages after this timestamp (optional)" },
          latest: { type: "string", description: "Only messages before this timestamp (optional)" },
        },
        required: ["channel"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
          messages: { type: "array" },
          has_more: { type: "boolean" },
        },
      },
    },

    add_reaction: {
      description:
        "Add an emoji reaction to a message. The emoji name should not include colons (e.g. 'thumbsup' not ':thumbsup:').",
      input: {
        type: "object",
        properties: {
          channel: { type: "string", description: "Channel ID where the message is" },
          timestamp: { type: "string", description: "Timestamp of the message to react to" },
          name: { type: "string", description: "Emoji name without colons (e.g. 'thumbsup')" },
        },
        required: ["channel", "timestamp", "name"],
      },
      output: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
        },
      },
    },
  },
};
