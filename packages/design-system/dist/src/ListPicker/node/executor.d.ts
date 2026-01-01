/**
 * ListPicker Node Executor
 * Auto-generated from Storybook component
 */
import { PromiseNode, type ValidationResult, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { ListPickerConfig, ListPickerOutput } from "../util/types";
export default class ListPickerExecutor extends PromiseNode {
    constructor();
    protected validateConfig(config: ListPickerConfig): Promise<ValidationResult>;
    protected executeNode(inputs: Record<string, any>, config: ListPickerConfig, context: NodeExecutionContext): Promise<ListPickerOutput>;
}
