import { createLogger } from "../../shared/platform";
import {
  HunterDomainSearchConfig,
  HunterDomainSearchOutput,
  HunterEmail,
  HunterDomainInfo,
} from "../util/types";

const HUNTER_API_BASE = "https://api.hunter.io/v2";

/**
 * Hunter Domain Search — return every email address Hunter has found for a domain.
 * https://hunter.io/api-documentation/v2#domain-search
 */
export async function hunterDomainSearch(
  config: HunterDomainSearchConfig,
  context: any,
): Promise<HunterDomainSearchOutput> {
  const logger = createLogger("HunterDomainSearch");

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

  const params: Record<string, any> = {
    api_key: apiKey,
    limit: Math.round(config.limit ?? 10),
    offset: Math.round(config.offset ?? 0),
  };

  if (config.domain?.trim()) params.domain = config.domain.trim();
  if (config.company?.trim()) params.company = config.company.trim();
  if (config.type?.trim()) params.type = config.type.trim();
  if (config.department?.trim()) params.department = config.department.trim();
  if (config.seniority?.trim()) params.seniority = config.seniority.trim();
  if (config.requiredField?.trim()) params.required_field = config.requiredField.trim();

  const url = new URL(`${HUNTER_API_BASE}/domain-search`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  logger.info("Calling Hunter Domain Search", {
    domain: params.domain,
    company: params.company,
    limit: params.limit,
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

  const emails: HunterEmail[] = (d.emails || []).map(
    (e: any): HunterEmail => ({
      value: e.value || "",
      type: e.type,
      confidence: e.confidence,
      first_name: e.first_name,
      last_name: e.last_name,
      position: e.position,
      seniority: e.seniority,
      department: e.department,
      linkedin: e.linkedin,
      twitter: e.twitter,
      phone_number: e.phone_number,
      verification_status: e.verification?.status,
    }),
  );

  const organization: HunterDomainInfo = {
    domain: d.domain,
    organization: d.organization,
    pattern: d.pattern,
    industry: d.industry,
    description: d.description,
    twitter: d.twitter,
    facebook: d.facebook,
    linkedin: d.linkedin,
    country: d.country,
    state: d.state,
    city: d.city,
    headcount: d.headcount,
    company_type: d.company_type,
    disposable: d.disposable,
    webmail: d.webmail,
    accept_all: d.accept_all,
  };

  const totalResults: number = data.meta?.results ?? emails.length;

  logger.info("Hunter Domain Search complete", {
    domain: d.domain,
    emails: emails.length,
    totalResults,
  });

  return {
    emails,
    organization,
    pattern: d.pattern,
    totalResults,
    limit: data.meta?.limit ?? config.limit ?? 10,
    offset: data.meta?.offset ?? config.offset ?? 0,
  };
}
