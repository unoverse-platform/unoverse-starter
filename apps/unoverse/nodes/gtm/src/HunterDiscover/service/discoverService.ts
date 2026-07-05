import { createLogger } from "../../shared/platform";
import { HunterDiscoverConfig, HunterDiscoverOutput, HunterDiscoverCompany } from "../util/types";

const HUNTER_API_BASE = "https://api.hunter.io/v2";

/** Split a comma-separated string into trimmed, non-empty values. */
function parseList(value: string | undefined): string[] {
  if (!value || !value.trim()) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Hunter Discover — find companies matching a set of criteria.
 * https://hunter.io/api-documentation/v2#discover
 *
 * POST with a structured body. `query` (natural language) is mutually exclusive
 * with the structured filters, so when a query is given we send it alone.
 */
export async function hunterDiscover(
  config: HunterDiscoverConfig,
  context: any,
): Promise<HunterDiscoverOutput> {
  const logger = createLogger("HunterDiscover");

  // context.credentials is keyed by credential name (04-credentials.md) and holds EVERY
  // workspace credential, not just this node's. Several (OpenAI, Apollo, SearchAPI) also
  // expose `apiKey`, so a blind field-signature scan grabs the wrong key. Select this
  // node's declared credential by name first; fall back to the scan for single-cred contexts.
  const available = context.credentials || {};
  const creds: any =
    available.hunterCredential ?? Object.values(available).find((v) => (v as any)?.apiKey);
  const apiKey = creds?.apiKey;

  if (!apiKey) {
    throw new Error("Hunter API key not found in credentials");
  }

  const limit = Math.min(Math.max(1, Math.round(config.limit ?? 25)), 100);
  const offset = Math.max(0, Math.round(config.offset ?? 0));

  const body: Record<string, any> = { limit, offset };

  const query = config.query?.trim();
  if (query) {
    // Natural-language query is mutually exclusive with structured filters.
    body.query = query;
  } else {
    const industry = parseList(config.industry);
    if (industry.length) body.industry = { include: industry };

    const countries = parseList(config.country);
    if (countries.length) {
      body.headquarters_location = { include: countries.map((c) => ({ country: c.toUpperCase() })) };
    }

    const headcount = parseList(config.headcount);
    if (headcount.length) body.headcount = headcount;

    const technology = parseList(config.technology);
    if (technology.length) body.technology = { include: technology };

    const keywords = parseList(config.keywords);
    if (keywords.length) body.keywords = { include: keywords };

    const companyType = parseList(config.companyType);
    if (companyType.length) body.company_type = { include: companyType };

    if (config.similarTo?.trim()) body.similar_to = config.similarTo.trim();
  }

  logger.info("Calling Hunter Discover", {
    mode: query ? "query" : "filters",
    filters: Object.keys(body).filter((k) => k !== "limit" && k !== "offset"),
    limit,
  });

  const response = await fetch(`${HUNTER_API_BASE}/discover`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Hunter API error ${response.status}: ${errorText}`);
  }

  const data: any = await response.json();

  const companies: HunterDiscoverCompany[] = (data.data || []).map(
    (c: any): HunterDiscoverCompany => ({
      domain: c.domain,
      organization: c.organization,
      emails_count: c.emails_count,
    }),
  );

  const totalResults: number = data.meta?.results ?? companies.length;

  logger.info("Hunter Discover complete", { companies: companies.length, totalResults });

  return {
    companies,
    totalResults,
    limit: data.meta?.limit ?? limit,
    offset: data.meta?.offset ?? offset,
  };
}
