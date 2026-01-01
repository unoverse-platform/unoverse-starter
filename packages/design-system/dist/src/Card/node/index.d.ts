/**
 * Card Node Definition
 * Auto-generated from Storybook component
 */
import { type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import CardExecutor from "./executor";
export declare const NODE_TYPE = "Card";
export declare function createNodeDefinition(): EnhancedNodeDefinition;
export declare const CardNode: {
    definition: any;
    executor: typeof CardExecutor;
};
export { createNodeDefinition as default };
