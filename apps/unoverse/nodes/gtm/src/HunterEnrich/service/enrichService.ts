import { createLogger } from "../../shared/platform";
import { HunterEnrichConfig, HunterEnrichOutput } from "../util/types";

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
 * Hunter Enrichment — return rich person and/or company profiles.
 * - "combined" (default): /combined/find?email=                  → person + company
 * - "person":             /people/find?email= | ?linkedin_handle= → person only
 * - "company":            /companies/find?domain=                 → company only
 * https://hunter.io/api-documentation/v2#enrichment
 */
export async function hunterEnrich(
  config: HunterEnrichConfig,
  context: any,
): Promise<HunterEnrichOutput> {
  const logger = createLogger("HunterEnrich");

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

  const type = (config.type || "combined").trim();
  const email = config.email?.trim();
  const domain = config.domain?.trim();
  const linkedinHandle = config.linkedinHandle?.trim();

  let path: string;
  const params: Record<string, string> = { api_key: apiKey };

  if (type === "company") {
    if (!domain) throw new Error("A domain is required for company enrichment");
    path = "companies/find";
    params.domain = domain;
  } else if (type === "person") {
    // people/find accepts email OR linkedin_handle (handle takes precedence).
    path = "people/find";
    if (linkedinHandle) {
      params.linkedin_handle = toLinkedinHandle(linkedinHandle);
    } else if (email) {
      params.email = email;
    } else {
      throw new Error("Person enrichment needs an email or a LinkedIn handle/URL");
    }
  } else {
    // combined/find requires an email.
    if (!email) throw new Error("An email is required for combined enrichment");
    path = "combined/find";
    params.email = email;
  }

  const url = new URL(`${HUNTER_API_BASE}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  logger.info("Calling Hunter Enrichment", { type, email, domain, linkedinHandle });

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

  // Normalise the three endpoint shapes into { person, company }.
  let person: Record<string, any> | null = null;
  let company: Record<string, any> | null = null;

  if (type === "combined") {
    person = d.person ?? null;
    company = d.company ?? null;
  } else if (type === "person") {
    person = d ?? null;
  } else {
    company = d ?? null;
  }

  logger.info("Hunter Enrichment complete", {
    type,
    hasPerson: !!person,
    hasCompany: !!company,
  });

  return { person, company };
}
