/**
 * AccountTransferWidget Node Executor
 * Auto-generated from Storybook component
 */
import { PromiseNode, type ValidationResult, type NodeExecutionContext } from "@gravity-platform/plugin-base";
import { AccountTransferWidgetConfig, AccountTransferWidgetOutput } from "../util/types";
export default class AccountTransferWidgetExecutor extends PromiseNode {
    constructor();
    protected validateConfig(config: AccountTransferWidgetConfig): Promise<ValidationResult>;
    protected executeNode(inputs: Record<string, any>, config: AccountTransferWidgetConfig, context: NodeExecutionContext): Promise<AccountTransferWidgetOutput>;
}
