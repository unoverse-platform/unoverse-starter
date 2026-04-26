/**
 * Core type definitions for Gravity Templates
 * Single source of truth for all template types
 */

/**
 * Streaming state enum
 */
export enum StreamingState {
  IDLE = "idle",
  STREAMING = "streaming",
  COMPLETE = "complete",
}

/**
 * Component within an assistant response
 */
export interface ResponseComponent {
  id: string;
  componentType: string;
  componentUrl?: string;
  nodeId?: string;
  chatId?: string;
  props?: Record<string, any>;
  metadata?: Record<string, any>;
  Component?: any;
}

/**
 * User message - simple text message
 */
export interface UserMessage {
  id: string;
  type: "user_message";
  role: "user";
  content: string;
  timestamp: string;
  chatId?: string;
}

/**
 * Assistant response - can contain multiple components
 */
export interface AssistantResponse {
  id: string;
  type: "assistant_response";
  role: "assistant";
  streamingState: StreamingState;
  components: ResponseComponent[];
  timestamp: string;
  chatId?: string;
}

/**
 * History entry - union of user message and assistant response
 */
export type HistoryEntry = UserMessage | AssistantResponse;

/**
 * Session parameters for workflow execution
 */
export interface SessionParams {
  conversationId: string;
  chatId: string;
  userId: string;
  workflowId: string;
  targetTriggerNode: string;
}

/**
 * Focus State - for component-centric conversations
 * When a component is focused, messages route to its trigger and update it in place
 */
export interface FocusState {
  /** ID of the focused component (matches component.id in history) */
  focusedComponentId: string | null;
  /** Target trigger node for routing messages when focused */
  targetTriggerNode: string | null;
  /** Chat ID to use when focused (same chatId = update existing component) */
  chatId: string | null;
  /** Display name for the focused agent (from focusLabel config) */
  agentName: string | null;
}

/**
 * Client context - everything templates need from the client
 */
export interface GravityClient {
  /** Send a message to the workflow - handles history + server communication */
  sendMessage: (message: string, options?: { targetTriggerNode?: string; chatId?: string }) => void;

  /** Send an agent message through server pipeline (for live agent, Amazon Connect, etc.) */
  sendAgentMessage: (data: {
    chatId: string;
    agentName?: string;
    source?: string;
    components: Array<{
      type: string;
      props: Record<string, any>;
      metadata?: Record<string, any>;
    }>;
  }) => void;

  /** Emit a custom action event (for cross-boundary communication) */
  emitAction: (type: string, data: any) => void;

  /** Send a voice call control message (START_CALL or END_CALL) */
  sendVoiceCallMessage?: (data: {
    message: string;
    userId: string;
    chatId: string;
    conversationId: string;
    workflowId: string;
    targetTriggerNode: string;
    action: "START_CALL" | "END_CALL";
  }) => Promise<void>;

  /** History for rendering (read-only) */
  history: {
    entries: HistoryEntry[];
    getResponses: () => AssistantResponse[];
  };

  /** Session context */
  session: SessionParams;

  /** Focus state for component-centric conversations */
  focusState?: FocusState;

  /** Open focus mode for a component */
  openFocus?: (componentId: string, targetTriggerNode: string | null, chatId: string | null) => void;

  /** Close focus mode */
  closeFocus?: () => void;

  /** Suggestions from workflow (FAQs, Actions, Recommendations) */
  suggestions?: {
    faqs?: Array<{ id?: string; question: string }>;
    actions?: Array<{
      object?: Record<string, any>;
      title?: string;
      description?: string;
      image?: string;
      callToAction?: string;
    }>;
    recommendations?: Array<{ id: string; text: string; confidence?: number; actionLabel?: string }>;
  };

  /** WebSocket URL for audio connections (e.g., ws://localhost:4100) */
  wsUrl?: string;

  /** Audio utilities for voice calls */
  audio?: {
    /** Microphone capture (continuous; provider-side VAD) */
    capture: {
      startCapture: () => Promise<{ success: boolean; reason?: string }>;
      stopCapture: () => Promise<{ success: boolean; reason?: string }>;
      /** Manually mute / unmute outgoing mic frames (keeps stream open) */
      setMuted: (muted: boolean) => void;
      isCapturing: boolean;
      /** Whether user is currently speaking (server-driven VAD signal) */
      isSpeaking: boolean;
      isLoading: boolean;
      error: string | null;
    };
    /** Whether assistant is currently speaking (from SPEECH_STARTED/SPEECH_ENDED events) */
    isAssistantSpeaking: boolean;
    /** Audio playback */
    playback: {
      playAudio: (audioData: ArrayBuffer) => void;
      stopAll: () => void;
      isPlaying: boolean;
    };
    /** WebSocket for audio streaming */
    websocket: {
      connect: () => Promise<void>;
      disconnect: () => void;
      sendAudio: (audioData: ArrayBuffer) => void;
      sendControl: (type: string, data?: Record<string, any>) => void;
      isConnected: boolean;
    };
    /** Subscribe to audio state changes (SESSION_READY, SPEECH_STARTED, etc.) */
    onAudioState?: (callback: (event: { state: string; metadata?: Record<string, any> }) => void) => () => void;
    /** Wait for a specific audio state (e.g., SESSION_READY before starting mic) */
    waitForState?: (
      targetState: string,
      timeoutMs?: number,
    ) => Promise<{ state: string; metadata?: Record<string, any> }>;
  };
}

/**
 * Base props that ALL templates must accept
 */
export interface GravityTemplateProps {
  /** Client context with all utilities */
  client: GravityClient;

  /** Callback: Template shares state back to client */
  onStateChange?: (state: { streamingState?: StreamingState; [key: string]: any }) => void;

  /** Workflow state from Zustand */
  workflowState?: "WORKFLOW_STARTED" | "WORKFLOW_COMPLETED" | null;
  workflowId?: string | null;
  workflowRunId?: string | null;

  /** Streaming state enum */
  streamingState?: StreamingState;

  /** Template-specific props */
  [key: string]: any;
}
