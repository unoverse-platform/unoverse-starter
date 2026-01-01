/**
 * Component publishing service
 * Publishes UI components to the client via gravity:output channel
 */
export declare const OUTPUT_CHANNEL = "gravity:output";
export declare function buildComponentEvent(config: {
    chatId: string;
    conversationId: string;
    userId: string;
    providerId?: string;
    component: Record<string, any>;
    metadata?: Record<string, any>;
}): Record<string, any>;
export interface ComponentPublishConfig {
    component: any;
    chatId: string;
    conversationId: string;
    userId: string;
    providerId: string;
    workflowId: string;
    workflowRunId: string;
    nodeId: string;
    targetTriggerNode?: string;
    metadata?: Record<string, any>;
    isUpdate?: boolean;
    changedProps?: Record<string, any>;
}
export declare function publishComponent(config: ComponentPublishConfig, api: any, context?: any): Promise<{
    channel: string;
    success: boolean;
}>;
