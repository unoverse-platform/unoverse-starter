import { runGLMAgent } from "../service/runGLMAgent";

const apiKey = process.env.ZAI_API_KEY;

// Minimal credential context — mirrors how the engine hands credentials in.
const credentialContext = {
  credentials: { zaiApiKey: { apiKey } },
  nodeType: "GLMAgent",
  workflowId: "test",
  executionId: "test",
  nodeId: "glm-test",
};

// No platform api → no Redis, no MCP tools (single-shot direct answer).
const executionContext: any = {};

const logger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
};

(apiKey ? describe : describe.skip)("GLMAgent (integration, real Z.AI API)", () => {
  it("returns a streamed completion from GLM-5.2", async () => {
    let streamed = "";
    const emit = (output: any) => {
      if (output?.__outputs?.chunk) streamed = output.__outputs.chunk;
    };

    const result = await runGLMAgent(
      {
        model: "glm-5.2",
        prompt: "Reply with exactly the word: pong",
        reasoningEffort: "none",
        maxTokens: 64,
      } as any,
      credentialContext,
      logger,
      executionContext,
      emit,
    );

    expect(result.__outputs).toBeDefined();
    expect(typeof result.__outputs.text).toBe("string");
    expect(result.__outputs.text.length).toBeGreaterThan(0);
    // chunk output was streamed during the run
    expect(streamed.length).toBeGreaterThan(0);
  }, 60000);
});
