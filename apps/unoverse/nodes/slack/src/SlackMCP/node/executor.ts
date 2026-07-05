import {
  getPlatformDependencies,
  type NodeExecutionContext,
} from "@gravity-platform/plugin-base";
import type { SlackCredentials } from "../../shared/slackClient";
import {
  sendMessage,
  listChannels,
  searchMessages,
  getUser,
  readHistory,
  addReaction,
} from "../service";
import { SlackMCPSchema } from "../service/mcpSchema";

const { PromiseNode, executeNodeWithRouting } = getPlatformDependencies();

const NODE_TYPE = "SlackMCP";

const KNOWN_METHODS = new Set([
  "getSchema",
  "send_message",
  "list_channels",
  "search_messages",
  "get_user",
  "read_history",
  "add_reaction",
]);

export default class SlackMCPExecutor extends PromiseNode {
  constructor() {
    super(NODE_TYPE);
  }

  private getCredentials(context: NodeExecutionContext): SlackCredentials {
    const available = (context as any).credentials || {};

    let creds: any;
    for (const val of Object.values(available)) {
      if ((val as any)?.token) {
        creds = val;
        break;
      }
    }

    if (!creds?.token) {
      throw new Error("Slack Bot Token credential is not configured");
    }

    return { token: creds.token, host: creds.host };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: any,
    context: NodeExecutionContext,
  ): Promise<any> {
    const credentials = await this.getCredentials(context);

    const channel = inputs.channel ?? config.defaultChannel;
    const text = inputs.text ?? inputs.input;

    if (!channel || !text) {
      return {
        __outputs: {
          output: { ok: false, error: "channel and text are required for workflow execution" },
        },
      };
    }

    const result = await sendMessage(credentials, { channel, text: String(text) });

    return {
      __outputs: {
        output: result,
      },
    };
  }

  async handleServiceCall(
    method: string,
    params: any,
    config: any,
    context: NodeExecutionContext,
  ): Promise<any> {
    if (method === "getSchema") {
      return SlackMCPSchema;
    }

    if (!KNOWN_METHODS.has(method)) {
      return {
        ok: false,
        error: "UNKNOWN_METHOD",
        hint: `Unknown method '${method}'. Available: send_message, list_channels, search_messages, get_user, read_history, add_reaction.`,
      };
    }

    const credentials = await this.getCredentials(context);
    let result: any;

    switch (method) {
      case "send_message":
        result = await sendMessage(credentials, params || {});
        break;
      case "list_channels":
        result = await listChannels(credentials, params || {});
        break;
      case "search_messages":
        result = await searchMessages(credentials, params || {});
        break;
      case "get_user":
        result = await getUser(credentials, params || {});
        break;
      case "read_history":
        result = await readHistory(credentials, params || {});
        break;
      case "add_reaction":
        result = await addReaction(credentials, params || {});
        break;
    }

    if (method === "send_message" && typeof executeNodeWithRouting === "function") {
      try {
        await executeNodeWithRouting(
          this.executeNode.bind(this),
          { channel: params?.channel, text: params?.text },
          config,
          context,
        );
      } catch (err: any) {
        this.logger.error(`[SlackMCP] executeNodeWithRouting failed: ${err?.message}`);
      }
    }

    return result;
  }
}
