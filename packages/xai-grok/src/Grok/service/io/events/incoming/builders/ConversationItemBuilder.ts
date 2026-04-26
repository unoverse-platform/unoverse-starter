export class ConversationItemBuilder {
  static buildUserMessage(text: string): Record<string, unknown> {
    return {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{ type: "input_text", text }],
      },
    };
  }

  static buildAssistantMessage(text: string): Record<string, unknown> {
    return {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "assistant",
        content: [{ type: "text", text }],
      },
    };
  }

  static buildFunctionCallOutput(callId: string, output: string): Record<string, unknown> {
    return {
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: callId,
        output,
      },
    };
  }
}
