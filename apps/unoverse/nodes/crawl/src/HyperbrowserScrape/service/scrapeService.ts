import { createLogger } from "../../shared/platform";
import {
  buildFetchOptions,
  getHyperbrowserApiKey,
  startAndPollJob,
} from "../../shared/hyperbrowser";
import { HyperbrowserScrapeConfig, HyperbrowserScrapeResult } from "../util/types";

/**
 * Scrape a single URL via the modern Fetch API (POST /api/web/fetch) and return
 * markdown / html / links. Replaces the deprecated /api/scrape endpoint.
 */
export async function scrapeUrl(
  config: HyperbrowserScrapeConfig,
  context: any
): Promise<HyperbrowserScrapeResult> {
  const logger = createLogger("HyperbrowserScrape");
  const apiKey = await getHyperbrowserApiKey(context);

  const { stealth, browser } = buildFetchOptions(config);

  const body: Record<string, any> = {
    url: config.url,
    stealth,
    outputs: {
      formats: ["markdown", "html", "links"],
      // "Main content only" maps to Fetch's content sanitizer, which strips
      // navigation/footer/boilerplate; off = return the full page.
      sanitize: config.onlyMainContent === false ? "none" : "basic",
    },
  };

  if (Object.keys(browser).length > 0) {
    body.browser = browser;
  }
  if (config.waitFor) {
    body.navigation = { waitFor: config.waitFor };
  }

  logger.info("Scraping URL via Fetch", { url: config.url });

  const payload = await startAndPollJob(apiKey, "web/fetch", body);
  const data = payload?.data || {};

  return {
    markdown: data.markdown || "",
    html: data.html || "",
    links: Array.isArray(data.links) ? data.links : [],
    metadata: data.metadata || {},
  };
}
