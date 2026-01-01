/**
 * BookingWidget Node Definition
 * Auto-generated from Storybook component
 */
import { type EnhancedNodeDefinition } from "@gravity-platform/plugin-base";
import BookingWidgetExecutor from "./executor";
export declare const NODE_TYPE = "BookingWidget";
export declare function createNodeDefinition(): EnhancedNodeDefinition;
export declare const BookingWidgetNode: {
    definition: any;
    executor: typeof BookingWidgetExecutor;
};
export { createNodeDefinition as default };
