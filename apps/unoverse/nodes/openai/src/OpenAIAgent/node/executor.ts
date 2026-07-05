import {
  getPlatformDependencies,
  type NodeExecutionContext,
  type ValidationResult,
} from "@unoverse-platform/plugin-base";
import { runOpenAIAgent } from "../service";
import type { OpenAIAgentConfig, OpenAIAgentState } from "../util/types";

const { CallbackNode } = getPlatformDependencies();

const MAX_CONTINUE_COUNT = 50;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export default class OpenAIAgentExecutor extends CallbackNode {
  constructor() {
    super("OpenAIAgent");
  }

  protected async validateConfig(config: OpenAIAgentConfig): Promise<ValidationResult> {
    return { success: true };
  }

  initializeState(inputs: any): OpenAIAgentState {
    return {
      chunk: "",
      text: "",
      hasStartedStreaming: false,
      continueCount: 0,
      firstExecuteTime: undefined,
    };
  }

  async handleEvent(
    event: { type: string; inputs?: any; config?: any },
    state: OpenAIAgentState,
    emit: (output: any) => void,
  ): Promise<any> {
    const resolvedConfig = event.config as OpenAIAgentConfig;
    const executionContext = (this as any).executionContext as NodeExecutionContext;
    const credentialContext = this.buildCredentialContext(executionContext);

    if (event.type === "CONTINUE") {
      const continueCount = (state.continueCount || 0) + 1;
      if (continueCount > MAX_CONTINUE_COUNT) {
        this.logger.warn(`[OpenAIAgent] Max CONTINUE count (${MAX_CONTINUE_COUNT}) exceeded - forcing completion`);
        return {
          ...state,
          isComplete: true,
          text: state.text || "Session ended: maximum conversation turns reached.",
        };
      }

      if (state.firstExecuteTime) {
        const elapsed = Date.now() - state.firstExecuteTime;
        if (elapsed > SESSION_TIMEOUT_MS) {
          this.logger.warn(`[OpenAIAgent] Session timeout exceeded - forcing completion`);
          return {
            ...state,
            isComplete: true,
            text: state.text || "Session ended: maximum session duration reached.",
          };
        }
      }

      const rawMessage = event.inputs?.continue;
      const userMessage = typeof rawMessage === "string" ? rawMessage : rawMessage?.message || rawMessage?.text || "";
      if (!userMessage) {
        this.logger.warn("[OpenAIAgent] CONTINUE signal received but no user message");
        return state;
      }

      this.logger.info(`[OpenAIAgent] CONTINUE - processing follow-up`, {
        hasResponseId: !!state.responseId,
        continueCount,
      });

      const finalOutput = await runOpenAIAgent(
        { ...resolvedConfig, prompt: userMessage },
        credentialContext,
        this.logger,
        executionContext,
        emit,
        state.responseId,
      );

      emit(finalOutput);

      const newState = {
        ...state,
        ...finalOutput.__outputs,
        responseId: finalOutput.__outputs?.responseId || state.responseId,
        continueCount,
      };
      if (finalOutput.__outputs?.focusInputRequired) {
        return newState;
      }
      return { ...newState, isComplete: true };
    }

    // EXECUTE - first run
    if (state.hasStartedStreaming || state.responseId) {
      this.logger.info(`[OpenAIAgent] Ignoring duplicate event - already processed`);
      return state;
    }

    if (resolvedConfig) {
      const updatedState = {
        ...state,
        hasStartedStreaming: true,
        firstExecuteTime: Date.now(),
      };

      const finalOutput = await runOpenAIAgent(
        resolvedConfig,
        credentialContext,
        this.logger,
        executionContext,
        emit,
      );

      emit(finalOutput);

      const newState = {
        ...updatedState,
        ...finalOutput.__outputs,
        responseId: finalOutput.__outputs?.responseId,
      };
      if (finalOutput.__outputs?.focusInputRequired) {
        return newState;
      }
      return { ...newState, isComplete: true };
    }

    return state;
  }

  private buildCredentialContext(context: NodeExecutionContext) {
    const { workflowId, executionId, nodeId } = this.validateAndGetContext(context);

    return {
      workflowId,
      executionId,
      nodeId,
      nodeType: this.nodeType,
      config: context.config,
      credentials: context.credentials || {},
    };
  }

  async cleanup(state: OpenAIAgentState): Promise<void> {
    return;
  }
}
