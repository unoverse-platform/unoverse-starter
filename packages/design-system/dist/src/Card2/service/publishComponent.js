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
        // Get WebSocket manager
        const wsManager = api?.getWebSocketManager?.();
        const websocket = wsManager?.get(config.userId, config.conversationId);
        // Always send COMPONENT_INIT - client handles deduplication
        // Client will: 1) Update Zustand state, 2) Add to history if not exists
        const componentKey = `${config.chatId}_${config.nodeId}`;
        const props = config.component.props || {};
        logger.info("🚀 Component INIT", {
            nodeId: config.nodeId,
            componentType: config.component.type,
            componentKey,
            props: Object.keys(props),
        });
        const event = {
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
                props,
            },
            metadata: {
                ...config.metadata,
                workflowId: config.workflowId,
                workflowRunId: config.workflowRunId,
                componentKey,
                targetTriggerNode: config.targetTriggerNode,
            },
        };
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
