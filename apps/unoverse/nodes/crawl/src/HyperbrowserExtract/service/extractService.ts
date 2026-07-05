import { createLogger } from "../../shared/platform";
import {
  buildFetchOptions,
  getHyperbrowserApiKey,
  startAndPollJob,
} from "../../shared/hyperbrowser";
import { HyperbrowserExtractConfig, HyperbrowserExtractResult } from "../util/types";

function normalizeUrls(urls: any): string[] {
  if (Array.isArray(urls)) {
    return urls.map((u) => String(u)).filter(Boolean);
  }
  if (typeof urls === "string") {
    const trimmed = urls.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map((u) => String(u)).filter(Boolean);
      } catch {
        // fall through to single-url handling
      }
    }
    return trimmed ? [trimmed] : [];
  }
  return [];
}

/**
 * Extract structured data from one or more URLs using a prompt and/or schema.
 *
 * Uses the modern Fetch API (POST /api/web/fetch) with a `json` output format —
 * the legacy /api/extract endpoint is deprecated. Fetch operates on a single URL,
 * so multiple URLs are fetched concurrently and their extractions collected.
 *
 * Output contract: a single URL returns the extracted object directly (as before);
 * multiple URLs return an array of `{ url, data }` so each page's result is labeled.
 */
export async function extractFromUrls(
  config: HyperbrowserExtractConfig,
  context: any
): Promise<HyperbrowserExtractResult> {
  const logger = createLogger("HyperbrowserExtract");
  const apiKey = await getHyperbrowserApiKey(context);

  const urls = normalizeUrls(config.urls);
  if (urls.length === 0) {
    throw new Error("HyperbrowserExtract requires at least one URL");
  }
  if (!config.prompt && !config.schema) {
    throw new Error("HyperbrowserExtract requires a prompt and/or a schema");
  }

  const { stealth, browser } = buildFetchOptions(config);

  // The structured-extraction directive now rides inside outputs.formats as a
  // json object; the result comes back at data.json.
  const jsonFormat: Record<string, any> = { type: "json" };
  if (config.schema) jsonFormat.schema = config.schema;
  if (config.prompt) jsonFormat.prompt = config.prompt;

  logger.info("Extracting structured data via Fetch", { urlCount: urls.length });

  const extractions = await Promise.all(
    urls.map(async (url) => {
      const body: Record<string, any> = {
        url,
        stealth,
        outputs: { formats: [jsonFormat] },
      };
      if (Object.keys(browser).length > 0) {
        body.browser = browser;
      }

      const payload = await startAndPollJob(apiKey, "web/fetch", body);
      return payload?.data?.json ?? null;
    })
  );

  const data =
    urls.length === 1
      ? extractions[0]
      : urls.map((url, i) => ({ url, data: extractions[i] }));

  return {
    data,
    metadata: {
      urls,
      timestamp: new Date().toISOString(),
    },
  };
}
