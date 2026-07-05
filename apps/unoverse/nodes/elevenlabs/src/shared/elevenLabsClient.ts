/**
 * Shared ElevenLabs HTTP client.
 *
 * One authenticated `fetch` wrapper re-implemented for this package (the
 * migration pattern: don't port the source bundle's request helper, re-create
 * the equivalent once). Credentials are read by FIELD SIGNATURE off the
 * execution context — not via api.getNodeCredentials() — per the marketplace
 * integration-node convention.
 */

export const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1";

export interface ElevenLabsCredentials {
  apiKey: string;
}

/**
 * Resolve the ElevenLabs credential off the execution context.
 *
 * `context.credentials` is the WHOLE workflow's credential map (loaded once for
 * every node, keyed by credential type), so a bare field-signature scan for
 * `.apiKey` is ambiguous — OpenAI, Anthropic, and most other credentials also
 * store their key under `apiKey`, and `Object.values()` order follows node
 * order. That hands ElevenLabs another service's key (→ 401 invalid_api_key)
 * whenever an apiKey-based node sits earlier in the workflow.
 *
 * So: resolve the node's declared credential type (`elevenlabsCredential`) by
 * key first. The field-signature scan is ONLY a safe fallback when the bag holds
 * a single credential (the doc's single-credential convenience case). With more
 * than one credential present a blind scan grabs whichever `.apiKey` happens to
 * be first (e.g. openAICredential) and silently authenticates against the wrong
 * service — the exact 401 invalid_api_key this guard prevents. In that case we
 * fail loudly so the real cause (no elevenlabsCredential attached to the node)
 * is visible instead of masked.
 */
const CREDENTIAL_TYPE = "elevenlabsCredential";

export function resolveCredentials(context: any): ElevenLabsCredentials {
  const available = (context && context.credentials) || {};

  // Name-first: the credential this node declares.
  let creds: any = available[CREDENTIAL_TYPE];

  // Fallback scan — only when a single credential is in the bag, so it cannot
  // grab a sibling node's foreign apiKey.
  if (!creds?.apiKey) {
    const entries = Object.values(available);
    if (entries.length === 1 && (entries[0] as any)?.apiKey) {
      creds = entries[0];
    }
  }

  const apiKey = typeof creds?.apiKey === "string" ? creds.apiKey.trim() : creds?.apiKey;
  if (!apiKey) {
    const present = Object.keys(available);
    throw new Error(
      `ElevenLabs credential (\`${CREDENTIAL_TYPE}\`) not found in this node's credentials. ` +
        `Attach an ElevenLabs credential to the node. ` +
        `Credentials resolved for this workflow: [${present.join(", ") || "none"}].`,
    );
  }

  return { apiKey };
}

function buildUrl(path: string, query?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${ELEVENLABS_API_BASE}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function readError(response: Response): Promise<string> {
  let detail = "";
  try {
    detail = await response.text();
  } catch {
    /* ignore */
  }
  return `ElevenLabs API error (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`;
}

/**
 * POST a JSON body and return the raw audio bytes (binary endpoints:
 * text-to-speech, text-to-dialogue, sound-generation).
 */
export async function postForAudio(
  path: string,
  apiKey: string,
  body: Record<string, any>,
  query?: Record<string, string | number | boolean | undefined>,
): Promise<ArrayBuffer> {
  const response = await fetch(buildUrl(path, query), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.arrayBuffer();
}

/** POST a JSON body and return the parsed JSON response. */
export async function postForJson<T = any>(
  path: string,
  apiKey: string,
  body: Record<string, any>,
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<T>;
}

/** POST a multipart/form-data body and return the parsed JSON response (speech-to-text). */
export async function postMultipart<T = any>(
  path: string,
  apiKey: string,
  form: FormData,
): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      // Do NOT set Content-Type — fetch sets the multipart boundary itself.
      "xi-api-key": apiKey,
    },
    body: form,
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return response.json() as Promise<T>;
}

/** base64-encode raw audio bytes for transport on the `__outputs` channel. */
export function toBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString("base64");
}
