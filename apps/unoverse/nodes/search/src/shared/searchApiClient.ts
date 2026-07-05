/**
 * Shared SearchAPI.io client.
 *
 * Every SearchAPI.io engine (google, google_news, youtube, google_maps, ...) is the
 * same base URL switched by `engine=`, authenticated with a single `api_key`. This
 * client is the one place credentials are fetched and HTTP errors are surfaced, so
 * each node's service only has to shape the engine-specific JSON response.
 */

const SEARCHAPI_BASE = "https://www.searchapi.io/api/v1/search";

export type SearchApiParams = Record<string, string | number | boolean | undefined | null>;

/**
 * Call a SearchAPI.io engine and return the raw parsed JSON.
 *
 * @param api               platform api (from NodeExecutionContext) — used to fetch credentials
 * @param credentialContext credential context built by the executor
 * @param engine            SearchAPI engine id, e.g. "google", "google_news", "youtube", "google_maps"
 * @param params            engine query params (q, num, gl, hl, ...). Empty/undefined values are dropped.
 */
export async function searchApi(
  api: any,
  credentialContext: any,
  engine: string,
  params: SearchApiParams
): Promise<any> {
  const credentials = await api.getNodeCredentials(credentialContext, "searchapiCredential");
  const apiKey = credentials?.apiKey;

  if (!apiKey) {
    throw new Error("SearchAPI.io API key not found in credentials (searchapiCredential)");
  }

  const qs = new URLSearchParams({ engine, api_key: apiKey });
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      qs.set(key, String(value));
    }
  }

  const response = await fetch(`${SEARCHAPI_BASE}?${qs.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    // SearchAPI returns a JSON body with the real reason (bad key, quota, bad param) —
    // surface it rather than the bare status text.
    const body = await response.text().catch(() => "");
    throw new Error(`SearchAPI ${engine} error ${response.status}: ${body || response.statusText}`);
  }

  return response.json();
}
