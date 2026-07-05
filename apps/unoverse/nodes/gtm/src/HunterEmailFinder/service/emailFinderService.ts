import { createLogger } from "../../shared/platform";
import { HunterEmailFinderConfig, HunterEmailFinderOutput } from "../util/types";

const HUNTER_API_BASE = "https://api.hunter.io/v2";

/**
 * Hunter's linkedin_handle expects the USERNAME only (e.g. "satyanadella"),
 * not a full URL. Accept either and reduce a pasted profile URL to the handle.
 */
function toLinkedinHandle(value: string): string {
  const v = value.trim();
  const match = v.match(/\/in\/([^/?#]+)/i);
  return (match ? match[1] : v).replace(/\/+$/, "").trim();
}

/**
 * Hunter Email Finder — find the most likely email address for a named person at a company.
 * https://hunter.io/api-documentation/v2#email-finder
 */
export async function hunterEmailFinder(
  config: HunterEmailFinderConfig,
  context: any,
): Promise<HunterEmailFinderOutput> {
  const logger = createLogger("HunterEmailFinder");

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

  const params: Record<string, any> = { api_key: apiKey };

  // A LinkedIn handle alone can identify the person (no domain/name needed).
  if (config.linkedinHandle?.trim()) params.linkedin_handle = toLinkedinHandle(config.linkedinHandle);
  if (config.domain?.trim()) params.domain = config.domain.trim();
  if (config.company?.trim()) params.company = config.company.trim();
  if (config.fullName?.trim()) {
    params.full_name = config.fullName.trim();
  } else {
    if (config.firstName?.trim()) params.first_name = config.firstName.trim();
    if (config.lastName?.trim()) params.last_name = config.lastName.trim();
  }

  const url = new URL(`${HUNTER_API_BASE}/email-finder`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  logger.info("Calling Hunter Email Finder", {
    domain: params.domain,
    company: params.company,
    name: params.full_name || `${params.first_name ?? ""} ${params.last_name ?? ""}`.trim(),
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(`Hunter API error ${response.status}: ${errorText}`);
  }

  const data: any = await response.json();
  const d = data.data || {};

  logger.info("Hunter Email Finder complete", {
    email: d.email,
    score: d.score,
  });

  return {
    email: d.email || "",
    score: d.score ?? 0,
    first_name: d.first_name,
    last_name: d.last_name,
    position: d.position,
    domain: d.domain,
    company: d.company,
    twitter: d.twitter,
    linkedin_url: d.linkedin_url,
    phone_number: d.phone_number,
    accept_all: d.accept_all,
    verification_status: d.verification?.status,
    sources_count: Array.isArray(d.sources) ? d.sources.length : 0,
  };
}
