"use strict";
/**
 * Component publishing service
 * Publishes UI components to the client via gravity:output channel
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OUTPUT_CHANNEL = void 0;
exports.buildComponentEvent = buildComponentEvent;
exports.publishComponent = publishComponent;
const uuid_1 = require("uuid");
exports.OUTPUT_CHANNEL = "gravity:output";
function buildComponentEvent(config) {
    if (!config.chatId || !config.conversationId || !config.userId) {
        throw new Error("chatId, conversationId, and userId are required");
    }
    return {
        id: (0, uuid_1.v4)(),
        timestamp: new Date().toISOString(),
        providerId: config.providerId || "design-system",
        chatId: config.chatId,
        conversationId: config.conversationId,
        userId: config.userId,
        __typename: "GravityEvent",
        type: "GRAVITY_EVENT",
        eventType: "component",
        data: {
            component: config.component,
            metadata: config.metadata || {},
        },
    };
}
async function publishComponent(config, api, context) {
    const logger = api?.createLogger?.("ComponentPublisher") || console;
    try {
        // Get WebSocket manager to check if component is already mounted on client
        const wsManager = api?.getWebSocketManager?.();
        const websocket = wsManager?.get(config.userId, config.conversationId);
        // Check if component is already mounted on the client
        // Use chatId in key so each request/response pair gets its own component instance
        const mountedComponents = websocket?.mountedComponents || new Set();
        const componentKey = `${config.chatId}_${config.nodeId}`;
        const isAlreadyMounted = mountedComponents.has(componentKey);
        // Build message based on whether component is already mounted
        let message;
        if (!isAlreadyMounted) {
            // COMPONENT_INIT - Send component definition with props
            // Props are already filtered by executor to exclude defaults
            const initialProps = config.component.props || {};
            logger.info("🚀 Component INIT", {
                nodeId: config.nodeId,
                componentType: config.component.type,
                componentKey,
                props: Object.keys(initialProps),
            });
            message = {
                id: (0, uuid_1.v4)(),
                timestamp: new Date().toISOString(),
                type: "COMPONENT_INIT",
                nodeId: config.nodeId,
                chatId: config.chatId,
                conversationId: config.conversationId,
                userId: config.userId,
                providerId: config.providerId,
                component: {
                    type: config.component.type,
                    componentUrl: config.component.componentUrl,
                    version: config.component.version,
                    props: initialProps,
                },
                metadata: {
                    ...config.metadata,
                    workflowId: config.workflowId,
                    workflowRunId: config.workflowRunId,
                    componentKey, // Send key so client can track it
                },
            };
            // Mark as mounted on the WebSocket connection
            if (websocket) {
                if (!websocket.mountedComponents) {
                    websocket.mountedComponents = new Set();
                }
                websocket.mountedComponents.add(componentKey);
            }
        }
        else {
            // COMPONENT_DATA - Send only props with actual values (filter out null/"")
            const currentProps = config.component.props || {};
            // Filter out null and empty string values to avoid overwriting existing data
            const filteredProps = Object.entries(currentProps).reduce((acc, [key, value]) => {
                if (value !== null && value !== "") {
                    acc[key] = value;
                }
                return acc;
            }, {});
            logger.info("🔄 Component DATA", {
                nodeId: config.nodeId,
                componentType: config.component.type,
                props: Object.keys(filteredProps),
            });
            message = {
                id: (0, uuid_1.v4)(),
                timestamp: new Date().toISOString(),
                type: "COMPONENT_DATA",
                nodeId: config.nodeId,
                chatId: config.chatId,
                conversationId: config.conversationId,
                userId: config.userId,
                providerId: config.providerId,
                data: filteredProps, // Send only props with values
                metadata: {
                    ...config.metadata,
                    workflowId: config.workflowId,
                    workflowRunId: config.workflowRunId,
                },
            };
        }
        const event = message;
        // Check if we have a valid WebSocket connection
        if (!wsManager) {
            logger.warn("WebSocket manager not available", {
                componentType: config.component.type,
            });
            return { channel: "websocket", success: false };
        }
        if (!websocket) {
            logger.warn("WebSocket connection not found - component not sent", {
                userId: config.userId,
                conversationId: config.conversationId,
                componentType: config.component.type,
            });
            return { channel: "websocket", success: false };
        }
        // Send to WebSocket
        websocket.send(JSON.stringify(event));
        logger.info("✅ Message sent", {
            type: event.type,
            nodeId: config.nodeId,
        });
        return { channel: "websocket", success: true };
    }
    catch (error) {
        logger.error("Failed to publish UI component", {
            error: error.message,
            workflowId: config.workflowId,
            nodeId: config.nodeId,
        });
        throw error;
    }
}
