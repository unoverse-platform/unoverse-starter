/**
 * Card Node Executor
 * Auto-generated from Storybook component
 */
import { PromiseNode, type ValidationResult, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { CardConfig, CardOutput } from "../util/types";
export default class CardExecutor extends PromiseNode {
    constructor();
    protected validateConfig(config: CardConfig): Promise<ValidationResult>;
    protected executeNode(inputs: Record<string, any>, config: CardConfig, context: NodeExecutionContext): Promise<CardOutput>;
}
