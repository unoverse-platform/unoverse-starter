import { createLogger } from "../../shared/platform";
import { HunterEmailVerifierConfig, HunterEmailVerifierOutput } from "../util/types";

const HUNTER_API_BASE = "https://api.hunter.io/v2";

/**
 * Hunter Email Verifier — check whether an email address is deliverable.
 * https://hunter.io/api-documentation/v2#email-verifier
 */
export async function hunterEmailVerifier(
  config: HunterEmailVerifierConfig,
  context: any,
): Promise<HunterEmailVerifierOutput> {
  const logger = createLogger("HunterEmailVerifier");

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

  const email = config.email?.trim();
  if (!email) {
    throw new Error("An email address is required to verify");
  }

  const url = new URL(`${HUNTER_API_BASE}/email-verifier`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("email", email);

  logger.info("Calling Hunter Email Verifier", { email });

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

  logger.info("Hunter Email Verifier complete", {
    email: d.email,
    status: d.status,
    result: d.result,
  });

  return {
    email: d.email || email,
    status: d.status || "unknown",
    result: d.result || "",
    score: d.score ?? 0,
    regexp: d.regexp,
    gibberish: d.gibberish,
    disposable: d.disposable,
    webmail: d.webmail,
    mx_records: d.mx_records,
    smtp_server: d.smtp_server,
    smtp_check: d.smtp_check,
    accept_all: d.accept_all,
    block: d.block,
  };
}
