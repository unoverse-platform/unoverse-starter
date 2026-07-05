import {
  getPlatformDependencies,
  type NodeExecutionContext,
  type ValidationResult,
} from "@gravity-platform/plugin-base";
import { runGLMAgent } from "../service";
import type { GLMAgentConfig, GLMAgentState } from "../util/types";

const { CallbackNode } = getPlatformDependencies();

const MAX_CONTINUE_COUNT = 50;
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export default class GLMAgentExecutor extends CallbackNode {
  constructor() {
    super("GLMAgent");
  }

  protected async validateConfig(_config: GLMAgentConfig): Promise<ValidationResult> {
    return { success: true };
  }

  initializeState(_inputs: any): GLMAgentState {
    return {
      chunk: "",
      text: "",
      hasStartedStreaming: false,
      history: [],
      continueCount: 0,
      firstExecuteTime: undefined,
    };
  }

  async handleEvent(
    event: { type: string; inputs?: any; config?: any },
    state: GLMAgentState,
    emit: (output: any) => void,
  ): Promise<any> {
    const resolvedConfig = event.config as GLMAgentConfig;
    const executionContext = (this as any).executionContext as NodeExecutionContext;
    const credentialContext = this.buildCredentialContext(executionContext);

    if (event.type === "CONTINUE") {
      const continueCount = (state.continueCount || 0) + 1;
      if (continueCount > MAX_CONTINUE_COUNT) {
        this.logger.warn(`[GLMAgent] Max CONTINUE count (${MAX_CONTINUE_COUNT}) exceeded - forcing completion`);
        return {
          ...state,
          isComplete: true,
          text: state.text || "Session ended: maximum conversation turns reached.",
        };
      }

      if (state.firstExecuteTime && Date.now() - state.firstExecuteTime > SESSION_TIMEOUT_MS) {
        this.logger.warn("[GLMAgent] Session timeout exceeded - forcing completion");
        return {
          ...state,
          isComplete: true,
          text: state.text || "Session ended: maximum session duration reached.",
        };
      }

      const rawMessage = event.inputs?.continue;
      const userMessage =
        typeof rawMessage === "string" ? rawMessage : rawMessage?.message || rawMessage?.text || "";
      if (!userMessage) {
        this.logger.warn("[GLMAgent] CONTINUE signal received but no user message");
        return state;
      }

      const result = await runGLMAgent(
        { ...resolvedConfig, prompt: userMessage },
        credentialContext,
        this.logger,
        executionContext,
        emit,
        state.history,
      );
      emit(result);

      return {
        ...state,
        ...result.__outputs,
        history: result.__outputs?.history || state.history,
        continueCount,
        isComplete: true,
      };
    }

    // EXECUTE - first run (ignore duplicate triggers)
    if (state.hasStartedStreaming) {
      this.logger.info("[GLMAgent] Ignoring duplicate event - already processed");
      return state;
    }

    if (!resolvedConfig) return state;

    const updatedState = { ...state, hasStartedStreaming: true, firstExecuteTime: Date.now() };
    const result = await runGLMAgent(resolvedConfig, credentialContext, this.logger, executionContext, emit);
    emit(result);

    return {
      ...updatedState,
      ...result.__outputs,
      history: result.__outputs?.history || [],
      isComplete: true,
    };
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

  async cleanup(_state: GLMAgentState): Promise<void> {
    return;
  }
}
