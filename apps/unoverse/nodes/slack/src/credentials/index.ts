export const SlackCredential = {
  name: "slackBotToken",
  displayName: "Slack",
  description: "Slack Bot User OAuth Token for API access",
  properties: [
    {
      name: "token",
      displayName: "Bot Token",
      type: "string" as const,
      required: true,
      secret: true,
      description: "Bot User OAuth Token (xoxb-...)",
      placeholder: "xoxb-...",
    },
    {
      name: "host",
      displayName: "Host",
      type: "string" as const,
      required: false,
      secret: false,
      description: "Slack API host (defaults to slack.com)",
      placeholder: "slack.com",
    },
  ],
};
