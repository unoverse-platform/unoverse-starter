import type { Doc, Section, SectionLevel } from "../util/types";
import { parseMarkdown, reconcile } from "./sectionizer";

const TTL_SECONDS = 60 * 60 * 6;
const MAX_RETRIES = 5;

export function keyFor(
  userId: string,
  workflowId: string,
  conversationId: string,
  nodeId: string,
): string {
  return `md:${userId}:${workflowId}:${conversationId}:${nodeId}`;
}

function redisFromApi(api: any): any {
  const client = api?.getRedisClient?.();
  if (!client) {
    throw new Error("Redis client unavailable (api.getRedisClient returned null)");
  }
  return client;
}

/**
 * Read the doc.
 * Lazy-migrates the legacy `{ content, version, updatedAt }` shape to the new
 * `{ sections, version, updatedAt }` shape on first access.
 */
export async function getDoc(
  api: any,
  key: string,
  sectionizeAt: SectionLevel = 2,
): Promise<Doc | null> {
  const redis = redisFromApi(api);
  const raw = await redis.get(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.sections)) {
      return parsed as Doc;
    }
    if (typeof parsed?.content === "string") {
      const migrated = migrateLegacy(parsed.content, parsed.version ?? 1, sectionizeAt);
      await redis.set(key, JSON.stringify(migrated), "EX", TTL_SECONDS);
      return migrated;
    }
    return null;
  } catch {
    return null;
  }
}

function migrateLegacy(content: string, version: number, sectionizeAt: SectionLevel): Doc {
  const sections = parseMarkdown(content, sectionizeAt);
  const doc: Doc = {
    sections,
    version: version + 1,
    updatedAt: new Date().toISOString(),
  };
  reconcile(doc);
  return doc;
}

/**
 * Initialise the doc from `initialMarkdown` if it doesn't exist.
 * No-op if the doc is already present.
 */
export async function initDoc(
  api: any,
  key: string,
  initialMarkdown: string,
  sectionizeAt: SectionLevel = 2,
): Promise<Doc> {
  const existing = await getDoc(api, key, sectionizeAt);
  if (existing) return existing;
  const sections = parseMarkdown(initialMarkdown, sectionizeAt);
  const doc: Doc = {
    sections,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
  reconcile(doc);
  const redis = redisFromApi(api);
  await redis.set(key, JSON.stringify(doc), "EX", TTL_SECONDS);
  return doc;
}

/**
 * Force a fresh doc from initialMarkdown, discarding existing state.
 * Generates new IDs.
 */
export async function resetDoc(
  api: any,
  key: string,
  initialMarkdown: string,
  sectionizeAt: SectionLevel = 2,
): Promise<Doc> {
  const sections = parseMarkdown(initialMarkdown, sectionizeAt);
  const doc: Doc = {
    sections,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
  reconcile(doc);
  const redis = redisFromApi(api);
  await redis.set(key, JSON.stringify(doc), "EX", TTL_SECONDS);
  return doc;
}

/**
 * Optimistic-locking mutation with Redis WATCH/MULTI.
 * `mutate` receives the current doc and may either mutate it in place + return ok,
 * or return an error object. Retries up to MAX_RETRIES on WATCH conflict.
 */
export async function mutateDoc(
  api: any,
  key: string,
  mutate: (doc: Doc) =>
    | { ok: true }
    | { ok: false; error: string; extra?: Record<string, any> },
): Promise<
  | { ok: true; doc: Doc }
  | { ok: false; error: string; extra?: Record<string, any> }
> {
  const redis = redisFromApi(api);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    await redis.watch(key);
    const raw = await redis.get(key);
    if (!raw) {
      await redis.unwatch();
      return { ok: false, error: "NOT_INITIALISED" };
    }

    let doc: Doc;
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed?.sections)) {
        await redis.unwatch();
        return { ok: false, error: "NOT_INITIALISED" };
      }
      doc = parsed as Doc;
    } catch {
      await redis.unwatch();
      return { ok: false, error: "NOT_INITIALISED" };
    }

    const result = mutate(doc);
    if (!result.ok) {
      await redis.unwatch();
      return result;
    }

    doc.version = doc.version + 1;
    doc.updatedAt = new Date().toISOString();
    reconcile(doc);

    const execResult = await redis
      .multi()
      .set(key, JSON.stringify(doc), "EX", TTL_SECONDS)
      .exec();

    if (execResult !== null) {
      return { ok: true, doc };
    }
    // else retry
  }

  return { ok: false, error: "CONCURRENT_UPDATE" };
}

export function findSection(doc: Doc, id: string): Section | undefined {
  return doc.sections.find((s) => s.id === id);
}

export function findSectionIndex(doc: Doc, id: string): number {
  return doc.sections.findIndex((s) => s.id === id);
}
