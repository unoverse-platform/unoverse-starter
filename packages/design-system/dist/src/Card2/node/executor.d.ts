/**
 * Card2 Node Executor
 * Auto-generated from Storybook component
 */
import { PromiseNode, type ValidationResult, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { Card2Config, Card2Output } from "../util/types";
export default class Card2Executor extends PromiseNode {
    constructor();
    protected validateConfig(config: Card2Config): Promise<ValidationResult>;
    protected executeNode(inputs: Record<string, any>, config: Card2Config, context: NodeExecutionContext): Promise<Card2Output>;
}
