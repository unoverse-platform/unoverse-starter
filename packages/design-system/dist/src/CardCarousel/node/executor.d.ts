/**
 * CardCarousel Node Executor
 * Auto-generated from Storybook component
 */
import { PromiseNode, type ValidationResult, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { CardCarouselConfig, CardCarouselOutput } from "../util/types";
export default class CardCarouselExecutor extends PromiseNode {
    constructor();
    protected validateConfig(config: CardCarouselConfig): Promise<ValidationResult>;
    protected executeNode(inputs: Record<string, any>, config: CardCarouselConfig, context: NodeExecutionContext): Promise<CardCarouselOutput>;
}
