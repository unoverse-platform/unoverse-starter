/**
 * ChatInput Node Definition
 * Auto-generated from Storybook component
 */
import { type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import ChatInputExecutor from "./executor";
export declare const NODE_TYPE = "ChatInput";
export declare function createNodeDefinition(): EnhancedNodeDefinition;
export declare const ChatInputNode: {
    definition: any;
    executor: typeof ChatInputExecutor;
};
export { createNodeDefinition as default };
