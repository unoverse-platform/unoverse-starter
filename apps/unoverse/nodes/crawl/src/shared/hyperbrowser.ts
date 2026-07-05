/**
 * Shared Hyperbrowser API client + session-option helpers.
 *
 * Legacy Hyperbrowser jobs (scrape / crawl / extract) are asynchronous: you POST to
 * start a job, receive a `jobId`, then poll `GET /{resource}/{jobId}` until the
 * status is `completed` or `failed`. The modern unified `web/fetch` endpoint may
 * instead return the finished result inline on the POST — startAndPollJob handles
 * both. This module centralises that flow plus the session-option set from the
 * create-new-session API so every sub-node exposes the same browser controls
 * (stealth, proxy, captcha solving, adblock, cookies).
 */
import { createLogger, getNodeCredentials } from "./platform";

const BASE_URL = "https://api.hyperbrowser.ai/api";

// "web/fetch" is the modern unified endpoint (POST /api/web/fetch) that replaces the
// legacy /api/scrape and /api/extract. It returns content (markdown/html/links) and,
// when an `outputs.formats` json object is supplied, structured data at `data.json`.
export type HyperbrowserResource = "scrape" | "crawl" | "extract" | "web/fetch";

/** Browser session controls — mirrors the create-new-session API. */
export interface HyperbrowserSessionOptions {
  useStealth?: boolean;
  useUltraStealth?: boolean;
  useProxy?: boolean;
  proxyCountry?: string;
  solveCaptchas?: boolean;
  adblock?: boolean;
  acceptCookies?: boolean;
}

/** The shared config shape the legacy-endpoint nodes (Crawl) extend. */
export interface HyperbrowserSessionConfig {
  useStealth?: boolean;
  useUltraStealth?: boolean;
  useProxy?: boolean;
  proxyCountry?: string;
  solveCaptchas?: boolean;
  adblock?: boolean;
  acceptCookies?: boolean;
}

/**
 * Config shape for nodes on the modern Fetch API (Scrape, Extract). Only the
 * controls Fetch actually honors — no adblock/acceptCookies/useProxy, which the
 * Fetch endpoint silently ignores.
 */
export interface HyperbrowserFetchConfig {
  useStealth?: boolean;
  useUltraStealth?: boolean;
  solveCaptchas?: boolean;
  country?: string;
}

/**
 * Reusable configSchema properties for the session controls. Spread into each
 * node's `configSchema.properties` so the UI is identical across sub-nodes.
 */
export const SESSION_CONFIG_PROPERTIES = {
  useStealth: {
    type: "boolean",
    title: "Stealth Mode",
    description: "Apply anti-bot fingerprinting to look like a real browser",
    default: true,
    "ui:widget": "toggle",
  },
  useUltraStealth: {
    type: "boolean",
    title: "Ultra Stealth",
    description: "Maximum anti-detection profile (slower; use only when stealth is blocked)",
    default: false,
    "ui:widget": "toggle",
  },
  useProxy: {
    type: "boolean",
    title: "Use Proxy",
    description: "Route the session through Hyperbrowser residential proxies",
    default: false,
    "ui:widget": "toggle",
  },
  proxyCountry: {
    type: "string",
    title: "Proxy Country",
    description: "ISO country code for the proxy exit (e.g. US, GB, FR)",
    placeholder: "US",
    "ui:dependencies": { useProxy: true },
  },
  solveCaptchas: {
    type: "boolean",
    title: "Solve CAPTCHAs",
    description: "Automatically solve CAPTCHAs encountered during the session",
    default: false,
    "ui:widget": "toggle",
  },
  adblock: {
    type: "boolean",
    title: "Block Ads",
    description: "Block advertisements and trackers while loading pages",
    default: true,
    "ui:widget": "toggle",
  },
  acceptCookies: {
    type: "boolean",
    title: "Accept Cookies",
    description: "Auto-dismiss cookie-consent banners",
    default: true,
    "ui:widget": "toggle",
  },
} as const;

/**
 * Reusable configSchema properties for the Fetch-API nodes (Scrape, Extract).
 * Only the controls /api/web/fetch actually supports — deliberately omits the
 * legacy adblock / acceptCookies / useProxy toggles that Fetch would ignore.
 */
export const FETCH_SESSION_CONFIG_PROPERTIES = {
  useStealth: SESSION_CONFIG_PROPERTIES.useStealth,
  useUltraStealth: SESSION_CONFIG_PROPERTIES.useUltraStealth,
  solveCaptchas: SESSION_CONFIG_PROPERTIES.solveCaptchas,
  country: {
    type: "string",
    title: "Location Country",
    description: "ISO country code to load the page from (e.g. US, GB, FR)",
    placeholder: "US",
  },
} as const;

/**
 * Map the Fetch-node controls onto the modern Fetch API's structured options
 * (`stealth` enum + nested `browser`). Used by nodes that POST to /api/web/fetch,
 * which no longer accepts the legacy `sessionOptions` boolean bag.
 */
export function buildFetchOptions(config: HyperbrowserFetchConfig): {
  stealth: "none" | "auto" | "ultra";
  browser: Record<string, any>;
} {
  const stealth = config.useUltraStealth ? "ultra" : config.useStealth ? "auto" : "none";

  const browser: Record<string, any> = {};
  if (config.solveCaptchas) browser.solveCaptchas = true;
  if (config.country) browser.location = { country: config.country };

  return { stealth, browser };
}

/** Build the Hyperbrowser `sessionOptions` payload from a node's config. */
export function buildSessionOptions(config: HyperbrowserSessionConfig): HyperbrowserSessionOptions {
  const options: HyperbrowserSessionOptions = {
    useStealth: config.useStealth ?? true,
    useUltraStealth: config.useUltraStealth ?? false,
    useProxy: config.useProxy ?? false,
    solveCaptchas: config.solveCaptchas ?? false,
    adblock: config.adblock ?? true,
    acceptCookies: config.acceptCookies ?? true,
  };

  if (options.useProxy && config.proxyCountry) {
    options.proxyCountry = config.proxyCountry;
  }

  return options;
}

/** Resolve the Hyperbrowser API key from the credential context. */
export async function getHyperbrowserApiKey(context: any): Promise<string> {
  const credentials = await getNodeCredentials(context, "hyperbrowserCredential");
  const apiKey = credentials?.apiKey;

  if (!apiKey) {
    throw new Error("Hyperbrowser API key not found in credentials");
  }

  return apiKey;
}

function authHeaders(apiKey: string): Record<string, string> {
  return {
    "x-api-key": apiKey,
    "Content-Type": "application/json",
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface StartAndPollOptions {
  /** Max number of status polls before giving up. Default 90. */
  maxPolls?: number;
  /** Delay between polls in ms. Default 2000. */
  intervalMs?: number;
  /** Optional query string appended to the status GET (e.g. "?page=1"). */
  statusQuery?: string;
}

/**
 * Start a Hyperbrowser job and poll until it completes.
 * Returns the final status payload (`{ jobId, status, data, ... }`).
 */
export async function startAndPollJob(
  apiKey: string,
  resource: HyperbrowserResource,
  body: Record<string, any>,
  options: StartAndPollOptions = {}
): Promise<any> {
  const logger = createLogger("HyperbrowserClient");
  const { maxPolls = 90, intervalMs = 2000, statusQuery = "" } = options;

  const startResponse = await fetch(`${BASE_URL}/${resource}`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify(body),
  });

  if (!startResponse.ok) {
    const errorText = await startResponse.text();
    throw new Error(`Hyperbrowser ${resource} start failed: ${startResponse.status} - ${errorText}`);
  }

  const startPayload = (await startResponse.json()) as any;

  // The Fetch endpoint (/api/web/fetch) may return the finished result inline on the
  // POST itself, with no jobId to poll. Honor a terminal status on the start payload.
  if (startPayload?.status === "completed") {
    logger.info(`Hyperbrowser ${resource} completed inline`);
    return startPayload;
  }
  if (startPayload?.status === "failed") {
    throw new Error(`Hyperbrowser ${resource} job failed: ${startPayload.error || "unknown error"}`);
  }

  const jobId = startPayload?.jobId;
  if (!jobId) {
    throw new Error(`Hyperbrowser ${resource}: no jobId returned`);
  }

  logger.info(`Started Hyperbrowser ${resource} job`, { jobId });

  for (let attempt = 0; attempt < maxPolls; attempt++) {
    await sleep(intervalMs);

    const statusResponse = await fetch(`${BASE_URL}/${resource}/${jobId}${statusQuery}`, {
      method: "GET",
      headers: authHeaders(apiKey),
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      throw new Error(`Hyperbrowser ${resource} status failed: ${statusResponse.status} - ${errorText}`);
    }

    const payload = (await statusResponse.json()) as any;

    if (payload.status === "completed") {
      logger.info(`Hyperbrowser ${resource} job completed`, { jobId });
      return payload;
    }

    if (payload.status === "failed") {
      throw new Error(`Hyperbrowser ${resource} job failed: ${payload.error || "unknown error"}`);
    }
  }

  throw new Error(`Hyperbrowser ${resource} job timed out after ${maxPolls} polls`);
}
