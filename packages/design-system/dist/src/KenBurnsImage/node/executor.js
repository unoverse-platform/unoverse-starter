"use strict";
/**
 * KenBurnsImage Node Executor
 * Auto-generated from Storybook component
 */
Object.defineProperty(exports, "__esModule", { value: true });
const plugin_base_1 = require("@gravity-platform/plugin-base");
const templates_1 = require("../service/templates");
const publishComponent_1 = require("../service/publishComponent");
class KenBurnsImageExecutor extends plugin_base_1.PromiseNode {
    constructor() {
        super("KenBurnsImage");
    }
    async validateConfig(config) {
        return { success: true };
    }
    async executeNode(inputs, config, context) {
        // Pass config values to component
        // Include all defined props, even empty strings (for streaming text)
        const props = {};
        if (config.src !== undefined) {
            props.src = config.src;
        }
        if (config.alt !== undefined) {
            props.alt = config.alt;
        }
        if (config.direction !== undefined) {
            props.direction = config.direction;
        }
        if (config.scale !== undefined) {
            props.scale = config.scale;
        }
        if (config.overlay !== undefined) {
            props.overlay = config.overlay;
        }
        if (config.grain !== undefined) {
            props.grain = config.grain;
        }
        if (config.particles !== undefined) {
            props.particles = config.particles;
        }
        // Load template (just need componentUrl)
        const template = (0, templates_1.loadDefaultTemplate)();
        // Generate ComponentSpec - minimal payload
        const componentSpec = {
            type: "KenBurnsImage",
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
        this.logger.info(`✅ [KenBurnsImage] ComponentSpec generated for node: ${context.nodeId}`);
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
        }, context.api, context // Pass full context for workflow state access
        );
        return {
            __outputs: {
                componentSpec,
            },
        };
    }
}
exports.default = KenBurnsImageExecutor;
