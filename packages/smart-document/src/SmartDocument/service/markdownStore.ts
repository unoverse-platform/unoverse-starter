import type { MarkdownDoc } from "../util/types";

const TTL_SECONDS = 60 * 60 * 6;

export function keyFor(conversationId: string, nodeId: string): string {
  return `md:${conversationId}:${nodeId}`;
}

function redisFromApi(api: any): any {
  const client = api?.getRedisClient?.();
  if (!client) {
    throw new Error("Redis client unavailable (api.getRedisClient returned null)");
  }
  return client;
}

export async function getDoc(api: any, key: string): Promise<MarkdownDoc | null> {
  const redis = redisFromApi(api);
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MarkdownDoc;
  } catch {
    return null;
  }
}

export async function initDoc(
  api: any,
  key: string,
  content: string
): Promise<MarkdownDoc> {
  const existing = await getDoc(api, key);
  if (existing) return existing;
  const doc: MarkdownDoc = {
    content,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
  const redis = redisFromApi(api);
  await redis.set(key, JSON.stringify(doc), "EX", TTL_SECONDS);
  return doc;
}

export async function replaceDoc(
  api: any,
  key: string,
  content: string
): Promise<MarkdownDoc> {
  const prev = await getDoc(api, key);
  const doc: MarkdownDoc = {
    content,
    version: (prev?.version ?? 0) + 1,
    updatedAt: new Date().toISOString(),
  };
  const redis = redisFromApi(api);
  await redis.set(key, JSON.stringify(doc), "EX", TTL_SECONDS);
  return doc;
}

export type PatchResult =
  | { ok: true; doc: MarkdownDoc }
  | { ok: false; error: string; extra?: Record<string, any> };

/**
 * Read-modify-write with optimistic concurrency via WATCH/MULTI.
 * `mutate` returns the new content or an error object.
 * Retries on WATCH conflict up to 5 times.
 */
export async function patchDoc(
  api: any,
  key: string,
  mutate: (
    current: string
  ) => { ok: true; content: string } | { ok: false; error: string; extra?: Record<string, any> }
): Promise<PatchResult> {
  const redis = redisFromApi(api);

  for (let attempt = 0; attempt < 5; attempt++) {
    await redis.watch(key);
    const raw = await redis.get(key);

    if (!raw) {
      await redis.unwatch();
      return { ok: false, error: "not_initialised" };
    }

    let prev: MarkdownDoc;
    try {
      prev = JSON.parse(raw);
    } catch {
      await redis.unwatch();
      return { ok: false, error: "not_initialised" };
    }

    const result = mutate(prev.content);
    if (!result.ok) {
      await redis.unwatch();
      return { ok: false, error: result.error, extra: result.extra };
    }

    const next: MarkdownDoc = {
      content: result.content,
      version: prev.version + 1,
      updatedAt: new Date().toISOString(),
    };

    const execResult = await redis
      .multi()
      .set(key, JSON.stringify(next), "EX", TTL_SECONDS)
      .exec();

    // exec returns null when WATCH detected a concurrent change
    if (execResult !== null) {
      return { ok: true, doc: next };
    }
    // else retry
  }

  return { ok: false, error: "concurrent_update" };
}
