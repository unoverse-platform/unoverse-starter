/**
 * KenBurnsImage Node Executor
 * Auto-generated from Storybook component
 */
import { PromiseNode, type ValidationResult, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { KenBurnsImageConfig, KenBurnsImageOutput } from "../util/types";
export default class KenBurnsImageExecutor extends PromiseNode {
    constructor();
    protected validateConfig(config: KenBurnsImageConfig): Promise<ValidationResult>;
    protected executeNode(inputs: Record<string, any>, config: KenBurnsImageConfig, context: NodeExecutionContext): Promise<KenBurnsImageOutput>;
}
