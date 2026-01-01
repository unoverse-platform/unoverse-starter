/**
 * AIResponse Node Executor
 * Auto-generated from Storybook component
 */
import { PromiseNode, type ValidationResult, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { AIResponseConfig, AIResponseOutput } from "../util/types";
export default class AIResponseExecutor extends PromiseNode {
    constructor();
    protected validateConfig(config: AIResponseConfig): Promise<ValidationResult>;
    protected executeNode(inputs: Record<string, any>, config: AIResponseConfig, context: NodeExecutionContext): Promise<AIResponseOutput>;
}
