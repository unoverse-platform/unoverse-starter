"use strict";
/**
 * BookingWidget Node Executor
 * Auto-generated from Storybook component
 */
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_base_1 = require("@gravity-platform/plugin-base");
const templates_1 = require("../service/templates");
const publishComponent_1 = require("../service/publishComponent");
class BookingWidgetExecutor extends plugin_base_1.PromiseNode {
    constructor() {
        super("BookingWidget");
    }
    async validateConfig(config) {
        return { success: true };
    }
    async executeNode(inputs, config, context) {
        // Pass config values to component
        // Include all defined props, even empty strings (for streaming text)
        const props = {};
        // Always pass focusable and focusLabel (universal Focus Mode config)
        if (config.focusable !== undefined) {
            props.focusable = config.focusable;
        }
        if (config.focusLabel !== undefined) {
            props.focusLabel = config.focusLabel;
        }
        if (config.bookingData !== undefined) {
            props.bookingData = config.bookingData;
        }
        if (config.editable !== undefined) {
            props.editable = config.editable;
        }
        if (config.onBookingChange !== undefined) {
            props.onBookingChange = config.onBookingChange;
        }
        if (config.onConfirm !== undefined) {
            props.onConfirm = config.onConfirm;
        }
        if (config.onCancel !== undefined) {
            props.onCancel = config.onCancel;
        }
        // Load template (just need componentUrl)
        const template = (0, templates_1.loadDefaultTemplate)();
        // Generate ComponentSpec - minimal payload
        const componentSpec = {
            type: "BookingWidget",
            version: "1.0.0",
            nodeId: context.nodeId, // Include nodeId at top level for client
            props,
            componentUrl: template.componentUrl,
            metadata: {
                dataSource: "direct",
                nodeId: context.nodeId,
                executionId: context.executionId,
            },
        };
        this.logger.info(`✅ [BookingWidget] ComponentSpec generated for node: ${context.nodeId}`);
        // Publish component to client
        // Get publishing context from workflow execution (chatId, userId, etc.)
        if (!context.publishingContext) {
            throw new Error("Publishing context not available - cannot publish component");
        }
        await (0, publishComponent_1.publishComponent)({
            component: componentSpec,
            chatId: context.publishingContext.chatId,
            conversationId: context.publishingContext.conversationId,
            userId: context.publishingContext.userId,
            providerId: context.publishingContext.providerId,
            workflowId: context.workflowId,
            workflowRunId: context.executionId,
            nodeId: context.nodeId,
            targetTriggerNode: context.publishingContext.targetTriggerNode, // For Focus Mode routing
        }, context.api, context // Pass full context for workflow state access
        );
        return {
            __outputs: {
                componentSpec,
            },
        };
    }
}
exports.default = BookingWidgetExecutor;
