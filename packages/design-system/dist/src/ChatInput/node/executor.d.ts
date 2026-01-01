/**
 * ChatInput Node Executor
 * Auto-generated from Storybook component
 */
import { PromiseNode, type ValidationResult, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { ChatInputConfig, ChatInputOutput } from "../util/types";
export default class ChatInputExecutor extends PromiseNode {
    constructor();
    protected validateConfig(config: ChatInputConfig): Promise<ValidationResult>;
    protected executeNode(inputs: Record<string, any>, config: ChatInputConfig, context: NodeExecutionContext): Promise<ChatInputOutput>;
}
