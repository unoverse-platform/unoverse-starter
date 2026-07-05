import { slackApi, type SlackCredentials } from "../../shared/slackClient";

export async function sendMessage(
  credentials: SlackCredentials,
  params: { channel: string; text: string; thread_ts?: string },
) {
  return slackApi(credentials, "chat.postMessage", {
    body: {
      channel: params.channel,
      text: params.text,
      ...(params.thread_ts && { thread_ts: params.thread_ts }),
    },
  });
}

export async function listChannels(
  credentials: SlackCredentials,
  params: { limit?: number; cursor?: string },
) {
  const result = await slackApi(credentials, "conversations.list", {
    method: "GET",
    params: {
      types: "public_channel",
      exclude_archived: "true",
      limit: String(Math.min(params.limit ?? 100, 200)),
      ...(params.cursor && { cursor: params.cursor }),
    },
  });

  return {
    ok: true,
    channels: result.channels?.map((ch: any) => ({
      id: ch.id,
      name: ch.name,
      topic: ch.topic?.value ?? "",
      purpose: ch.purpose?.value ?? "",
      num_members: ch.num_members,
    })),
    has_more: !!result.response_metadata?.next_cursor,
    next_cursor: result.response_metadata?.next_cursor ?? null,
  };
}

export async function searchMessages(
  credentials: SlackCredentials,
  params: { query: string; count?: number },
) {
  return slackApi(credentials, "search.messages", {
    method: "GET",
    params: {
      query: params.query,
      count: String(Math.min(params.count ?? 20, 100)),
    },
  });
}

export async function getUser(
  credentials: SlackCredentials,
  params: { user_id?: string; email?: string },
) {
  if (params.email) {
    return slackApi(credentials, "users.lookupByEmail", {
      method: "GET",
      params: { email: params.email },
    });
  }

  if (params.user_id) {
    return slackApi(credentials, "users.info", {
      method: "GET",
      params: { user: params.user_id },
    });
  }

  throw new Error("Either user_id or email is required");
}

export async function readHistory(
  credentials: SlackCredentials,
  params: { channel: string; limit?: number; oldest?: string; latest?: string },
) {
  return slackApi(credentials, "conversations.history", {
    method: "GET",
    params: {
      channel: params.channel,
      limit: String(Math.min(params.limit ?? 25, 100)),
      ...(params.oldest && { oldest: params.oldest }),
      ...(params.latest && { latest: params.latest }),
    },
  });
}

export async function addReaction(
  credentials: SlackCredentials,
  params: { channel: string; timestamp: string; name: string },
) {
  return slackApi(credentials, "reactions.add", {
    body: {
      channel: params.channel,
      timestamp: params.timestamp,
      name: params.name.replace(/^:|:$/g, ""),
    },
  });
}
