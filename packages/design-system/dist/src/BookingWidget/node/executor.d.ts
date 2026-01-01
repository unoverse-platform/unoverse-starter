/**
 * BookingWidget Node Executor
 * Auto-generated from Storybook component
 */
import { PromiseNode, type ValidationResult, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { BookingWidgetConfig, BookingWidgetOutput } from "../util/types";
export default class BookingWidgetExecutor extends PromiseNode {
    constructor();
    protected validateConfig(config: BookingWidgetConfig): Promise<ValidationResult>;
    protected executeNode(inputs: Record<string, any>, config: BookingWidgetConfig, context: NodeExecutionContext): Promise<BookingWidgetOutput>;
}
