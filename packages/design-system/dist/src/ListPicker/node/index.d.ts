/**
 * ListPicker Node Definition
 * Auto-generated from Storybook component
 */
import { type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import ListPickerExecutor from "./executor";
export declare const NODE_TYPE = "ListPicker";
export declare function createNodeDefinition(): EnhancedNodeDefinition;
export declare const ListPickerNode: {
    definition: any;
    executor: typeof ListPickerExecutor;
};
export { createNodeDefinition as default };
