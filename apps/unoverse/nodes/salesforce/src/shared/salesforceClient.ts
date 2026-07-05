export interface SalesforceCredentials {
  /** My Domain / login URL — used for the OAuth token endpoint. */
  host: string;
  clientId: string;
  clientSecret: string;
  apiVersion?: string;
}

export interface SalesforceRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | undefined>;
  body?: Record<string, any>;
}

interface CachedToken {
  accessToken: string;
  instanceUrl: string;
  expiresOn: number;
}

const DEFAULT_API_VERSION = "v52.0";
// Salesforce client-credentials sessions default to ~2h; refresh comfortably before that.
const TOKEN_TTL_MS = 110 * 60 * 1000;

// Module-level token cache, keyed by connected-app identity. Mirrors the .ssi
// bundle's configCache: mint once, reuse until expiry. Safe to share across
// executions because the credential (a service account) is workspace-scoped.
const tokenCache = new Map<string, CachedToken>();

function baseUrl(host: string): string {
  let h = host.trim().replace(/\/+$/, "");
  if (!/^https?:\/\//.test(h)) h = `https://${h}`;
  return h;
}

/**
 * OAuth2 Client Credentials grant — exchange the connected app's
 * clientId/clientSecret for a short-lived access token + instance URL.
 * Source: the .ssi bundle's `authenticate.js` (clientId path).
 */
async function getAccessToken(
  credentials: SalesforceCredentials,
  forceRefresh = false,
): Promise<CachedToken> {
  const cacheKey = `${credentials.clientId}@${baseUrl(credentials.host)}`;

  const cached = tokenCache.get(cacheKey);
  if (!forceRefresh && cached && cached.expiresOn > Date.now()) {
    return cached;
  }

  const tokenUrl = `${baseUrl(credentials.host)}/services/oauth2/token`;
  const form = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: form.toString(),
  });

  const data: any = await response.json().catch(() => null);

  if (!response.ok || !data?.access_token) {
    const detail = data?.error_description ?? data?.error ?? response.statusText;
    throw new Error(`Salesforce authentication failed (${response.status}): ${detail}`);
  }

  const token: CachedToken = {
    accessToken: data.access_token,
    instanceUrl: (data.instance_url ?? baseUrl(credentials.host)).replace(/\/+$/, ""),
    expiresOn: Date.now() + TOKEN_TTL_MS,
  };
  tokenCache.set(cacheKey, token);
  return token;
}

/**
 * Authenticated request against the Salesforce REST API.
 *
 * Equivalent of the .ssi bundle's `request.js`: resolves a valid access token
 * (minting/refreshing via client credentials), targets the token's instance URL
 * under `/services/data/<version>/`, and normalizes the response (204 No Content,
 * Salesforce's array-of-errors shape). Auto-refreshes once on a 401.
 */
export async function salesforceApi(
  credentials: SalesforceCredentials,
  path: string,
  options: SalesforceRequestOptions = {},
): Promise<any> {
  return requestWithAuth(credentials, path, options, false);
}

async function requestWithAuth(
  credentials: SalesforceCredentials,
  path: string,
  options: SalesforceRequestOptions,
  isRetry: boolean,
): Promise<any> {
  const { accessToken, instanceUrl } = await getAccessToken(credentials, isRetry);
  const version = credentials.apiVersion?.trim() || DEFAULT_API_VERSION;

  let url = `${instanceUrl}/services/data/${version}${path.startsWith("/") ? path : `/${path}`}`;

  if (options.query) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(options.query)) {
      if (value === undefined) continue;
      searchParams.set(key, String(value));
    }
    const qs = searchParams.toString();
    if (qs) url += `${url.includes("?") ? "&" : "?"}${qs}`;
  }

  const httpMethod = options.method ?? "GET";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json; charset=utf-8",
    Accept: "application/json",
  };

  const fetchOptions: RequestInit = { method: httpMethod, headers };
  if (options.body && httpMethod !== "GET") {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);

  // Token expired or revoked — refresh once and retry.
  if (response.status === 401 && !isRetry) {
    return requestWithAuth(credentials, path, options, true);
  }

  // 204 No Content — updates/deletes succeed with an empty body.
  if (response.status === 204) {
    return { success: true };
  }

  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    // Salesforce returns an array of { message, errorCode } objects on error.
    const message = Array.isArray(data)
      ? data.map((e: any) => e.message ?? e.errorCode).filter(Boolean).join("; ")
      : data?.message ?? data?.error ?? response.statusText;
    throw new Error(`Salesforce API error (${response.status}): ${message}`);
  }

  return data;
}
