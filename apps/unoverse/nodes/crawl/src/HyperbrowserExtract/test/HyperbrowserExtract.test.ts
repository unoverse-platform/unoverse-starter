import { extractFromUrls } from "../service/extractService";

/**
 * HyperbrowserExtract — integration test (real Hyperbrowser API).
 *
 * Provide a key via `HYPERBROWSER_API_KEY` (put it in packages-marketplace/crawl/.env
 * — gitignored; see .env.example). Without a key the suite is SKIPPED (not silently
 * passed), so CI without secrets stays green and a dev with the key gets real coverage.
 *
 * Credentials reach the service exactly as the engine delivers them:
 * context.credentials[<type>] — resolved by plugin-base's getNodeCredentials stub
 * when the platform isn't initialized, so no running platform is required.
 */
const apiKey = process.env.HYPERBROWSER_API_KEY;

const ctx = {
  credentials: { hyperbrowserCredential: { apiKey } },
  nodeType: "HyperbrowserExtract",
  workflowId: "test-harness",
  executionId: "test-harness",
  nodeId: "hyperbrowserextract-test",
};

(apiKey ? describe : describe.skip)("HyperbrowserExtract (integration, real API)", () => {
  it("extracts structured data from a single URL and returns within budget", async () => {
    const result = await extractFromUrls(
      {
        urls: ["https://example.com"],
        prompt: "Return the page's main heading as { heading: string }",
      } as any,
      ctx,
    );

    expect(result).toBeDefined();
    expect(result.data).toBeDefined();
  });
});
