/**
 * CardFinder Node Executor
 * Auto-generated from Storybook component
 */
import { PromiseNode, type ValidationResult, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { CardFinderConfig, CardFinderOutput } from "../util/types";
export default class CardFinderExecutor extends PromiseNode {
    constructor();
    protected validateConfig(config: CardFinderConfig): Promise<ValidationResult>;
    protected executeNode(inputs: Record<string, any>, config: CardFinderConfig, context: NodeExecutionContext): Promise<CardFinderOutput>;
}
