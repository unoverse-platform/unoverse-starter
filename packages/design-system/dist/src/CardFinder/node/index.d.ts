/**
 * CardFinder Node Definition
 * Auto-generated from Storybook component
 */
import { type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import CardFinderExecutor from "./executor";
export declare const NODE_TYPE = "CardFinder";
export declare function createNodeDefinition(): EnhancedNodeDefinition;
export declare const CardFinderNode: {
    definition: any;
    executor: typeof CardFinderExecutor;
};
export { createNodeDefinition as default };
