import { crawlSite } from "../service/crawlService";

/**
 * HyperbrowserCrawl — integration test (real Hyperbrowser API).
 * Needs HYPERBROWSER_API_KEY in packages-marketplace/crawl/.env (see .env.example).
 * Skipped (not failed) when the key is absent. maxPages is kept at 1 so the test
 * stays fast and cheap.
 */
const apiKey = process.env.HYPERBROWSER_API_KEY;

const ctx = {
  credentials: { hyperbrowserCredential: { apiKey } },
  nodeType: "HyperbrowserCrawl",
  workflowId: "test-harness",
  executionId: "test-harness",
  nodeId: "hyperbrowsercrawl-test",
};

(apiKey ? describe : describe.skip)("HyperbrowserCrawl (integration, real API)", () => {
  it("crawls a seed URL and returns pages", async () => {
    const result = await crawlSite({ url: "https://example.com", maxPages: 1 } as any, ctx);

    expect(result).toBeDefined();
    expect(Array.isArray(result.pages)).toBe(true);
    expect(result.pages.length).toBeGreaterThan(0);
  });
});
