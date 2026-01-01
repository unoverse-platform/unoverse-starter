/**
 * AIResponse Node Definition
 * Auto-generated from Storybook component
 */
import { type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import AIResponseExecutor from "./executor";
export declare const NODE_TYPE = "AIResponse";
export declare function createNodeDefinition(): EnhancedNodeDefinition;
export declare const AIResponseNode: {
    definition: any;
    executor: typeof AIResponseExecutor;
};
export { createNodeDefinition as default };
