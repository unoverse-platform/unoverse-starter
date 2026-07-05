import { createLogger } from "../../shared/platform";
import {
  buildSessionOptions,
  getHyperbrowserApiKey,
  startAndPollJob,
} from "../../shared/hyperbrowser";
import { CrawledPage, HyperbrowserCrawlConfig, HyperbrowserCrawlResult } from "../util/types";

function splitPatterns(value?: string): string[] | undefined {
  if (!value) return undefined;
  const patterns = value
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  return patterns.length > 0 ? patterns : undefined;
}

/**
 * Crawl a site from a seed URL across multiple pages.
 */
export async function crawlSite(
  config: HyperbrowserCrawlConfig,
  context: any
): Promise<HyperbrowserCrawlResult> {
  const logger = createLogger("HyperbrowserCrawl");
  const apiKey = await getHyperbrowserApiKey(context);

  const body: Record<string, any> = {
    url: config.url,
    maxPages: config.maxPages ?? 10,
    sessionOptions: buildSessionOptions(config),
    scrapeOptions: {
      formats: ["markdown", "links"],
      onlyMainContent: config.onlyMainContent ?? true,
    },
  };

  const includePatterns = splitPatterns(config.includePatterns);
  if (includePatterns) body.includePatterns = includePatterns;
  const excludePatterns = splitPatterns(config.excludePatterns);
  if (excludePatterns) body.excludePatterns = excludePatterns;

  logger.info("Crawling site", { url: config.url, maxPages: body.maxPages });

  const payload = await startAndPollJob(apiKey, "crawl", body);
  const rawPages: any[] = Array.isArray(payload?.data) ? payload.data : [];

  const pages: CrawledPage[] = rawPages.map((page) => ({
    url: page.url || "",
    markdown: page.markdown || "",
    links: Array.isArray(page.links) ? page.links : [],
    metadata: page.metadata || {},
  }));

  const links = pages.flatMap((page) => page.links);

  return {
    pages,
    links,
    metadata: {
      url: config.url,
      totalPages: pages.length,
      timestamp: new Date().toISOString(),
    },
  };
}
