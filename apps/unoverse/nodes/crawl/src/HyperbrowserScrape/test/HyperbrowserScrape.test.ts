import { scrapeUrl } from "../service/scrapeService";

/**
 * HyperbrowserScrape — integration test (real Hyperbrowser API).
 * Needs HYPERBROWSER_API_KEY in packages-marketplace/crawl/.env (see .env.example).
 * Skipped (not failed) when the key is absent.
 */
const apiKey = process.env.HYPERBROWSER_API_KEY;

const ctx = {
  credentials: { hyperbrowserCredential: { apiKey } },
  nodeType: "HyperbrowserScrape",
  workflowId: "test-harness",
  executionId: "test-harness",
  nodeId: "hyperbrowserscrape-test",
};

(apiKey ? describe : describe.skip)("HyperbrowserScrape (integration, real API)", () => {
  it("scrapes a single URL to markdown", async () => {
    const result = await scrapeUrl({ url: "https://example.com" } as any, ctx);

    expect(result).toBeDefined();
    expect(typeof result.markdown).toBe("string");
    expect(result.markdown.length).toBeGreaterThan(0);
  });
});
