"use strict";
/**
 * ChatInput Node Executor
 * Auto-generated from Storybook component
 */
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_base_1 = require("@gravity-platform/plugin-base");
const templates_1 = require("../service/templates");
const publishComponent_1 = require("../service/publishComponent");
class ChatInputExecutor extends plugin_base_1.PromiseNode {
    constructor() {
        super("ChatInput");
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
        if (config.placeholder !== undefined) {
            props.placeholder = config.placeholder;
        }
        if (config.disabled !== undefined) {
            props.disabled = config.disabled;
        }
        if (config.enableAudio !== undefined) {
            props.enableAudio = config.enableAudio;
        }
        if (config.faqs !== undefined) {
            props.faqs = config.faqs;
        }
        if (config.actions !== undefined) {
            props.actions = config.actions;
        }
        if (config.onSend !== undefined) {
            props.onSend = config.onSend;
        }
        if (config.onFaqClick !== undefined) {
            props.onFaqClick = config.onFaqClick;
        }
        if (config.onActionClick !== undefined) {
            props.onActionClick = config.onActionClick;
        }
        // Load template (just need componentUrl)
        const template = (0, templates_1.loadDefaultTemplate)();
        // Generate ComponentSpec - minimal payload
        const componentSpec = {
            type: "ChatInput",
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
        this.logger.info(`✅ [ChatInput] ComponentSpec generated for node: ${context.nodeId}`);
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
exports.default = ChatInputExecutor;
