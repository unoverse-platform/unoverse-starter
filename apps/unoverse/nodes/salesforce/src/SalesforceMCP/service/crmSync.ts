import { type SalesforceCredentials } from "../../shared/salesforceClient";
import { queryRecords, createRecord } from "./index";

/**
 * The CRM Sync contract — the standardized lane for the user-memory ⇄ CRM sync.
 *
 * Four intent-level methods layered on the raw primitives (query/create). Callers
 * (the agent, the memory page) use THESE, never hand-built SOQL, so every CRM touch
 * is consistent and the safety rails are enforced in code rather than in prompts:
 *
 *   - reads are bounded to a fixed identity allowlist (never SELECT *)
 *   - writes are APPEND-ONLY: crm_write_insight can only create a Task. There is no
 *     code path here to update_record or to write a Contact/core profile field.
 *
 * This is the CRM-agnostic contract; Salesforce is one implementation. A different
 * CRM adapter would implement the same four. See CRM_SYNC.md.
 */

// Machine-authored marker. Stamped on every insight write; used to read them back.
export const AI_STAMP = "Gravity AI — machine-authored, unverified";

// Short-lived snapshot cache so dashboards (e.g. the memory page) can show the
// last-imported CRM identity + synced insights WITHOUT calling Salesforce
// themselves. PII evaporates 10 min after the last touch.
const SNAPSHOT_TTL_SECONDS = 600;

// node-service's Redis client applies no keyPrefix, but the memory server's client
// prepends `${REDIS_NAMESPACE}:`. Prepend it here so both land on the same key.
function snapshotKey(userId: string, workflowId: string): string {
  const ns = process.env.REDIS_NAMESPACE ? `${process.env.REDIS_NAMESPACE}:` : "";
  return `${ns}crm:${userId}:${workflowId}`;
}

/**
 * Deterministic user import (cache-aside). Runs from the node's workflow channel
 * on conversation activity, but only HITS Salesforce when the snapshot is cold —
 * i.e. the user is first seen, or the 10-min TTL has expired. While a snapshot is
 * warm it no-ops, so Salesforce is touched at most ~once per 10 min per user.
 *
 * No LLM involved — knowing who the user is shouldn't be a model decision.
 */
export async function syncUserSnapshot(
  api: any,
  userId: string | undefined,
  workflowId: string | undefined,
  credentials: SalesforceCredentials,
  email: string | undefined,
): Promise<any> {
  if (!userId || !workflowId) return { ok: false, skipped: "no-scope" };
  // Guest / synthetic sessions carry no email — nothing to join on. No-op.
  if (!email) return { ok: false, skipped: "no-email" };

  const redis = api?.getRedisClient?.();
  // Cache-aside: warm snapshot (within TTL) → no Salesforce call, but still return the
  // cached contactId so the caller can hydrate (the outbox is rare and worth a write).
  if (redis) {
    try {
      const existing = await redis.get(snapshotKey(userId, workflowId));
      if (existing) {
        const snap = JSON.parse(existing);
        return { ok: true, cached: true, skipped: "warm", contactId: snap?.contact?.id ?? null };
      }
    } catch {
      // fall through and resolve
    }
  }

  // Cold → resolve against Salesforce and cache (resets the 10-min TTL).
  const resolved = await crmResolveUser(credentials, { email });
  await cacheSnapshot(api, userId, workflowId, { contact: resolved.profile });
  return { ok: resolved.ok, found: resolved.found, refreshed: true, contactId: resolved.contactId ?? null };
}

/**
 * Hydrate (memory → CRM): drain the Redis outbox the memory server fills when a new
 * high-certainty L3 deduction forms, writing each as an append-only Task on the
 * contact (L3 logical conclusions, not speculative L4 best-guesses). Dedup is
 * inherent — items are LPOP'd off the queue, so each is written once. Bounded per run.
 */
export async function drainHydrateOutbox(
  api: any,
  userId: string | undefined,
  workflowId: string | undefined,
  credentials: SalesforceCredentials,
  contactId: string | null | undefined,
): Promise<{ ok: boolean; written: number }> {
  if (!userId || !workflowId || !contactId) return { ok: false, written: 0 };
  const redis = api?.getRedisClient?.();
  if (!redis) return { ok: false, written: 0 };

  const ns = process.env.REDIS_NAMESPACE ? `${process.env.REDIS_NAMESPACE}:` : "";
  const key = `${ns}crm:hydrate:${userId}:${workflowId}`;
  let written = 0;
  try {
    for (let i = 0; i < 25; i++) {
      const raw = await redis.lpop(key);
      if (!raw) break;
      try {
        const item = JSON.parse(raw);
        if (item?.claim) {
          await crmWriteInsight(credentials, { contactId, insight: item.claim, certainty: item.certainty });
          written++;
        }
      } catch {
        // skip malformed item
      }
    }
  } catch {
    // best-effort
  }
  return { ok: true, written };
}

/**
 * Merge a partial into the cached CRM snapshot and re-set the TTL. Best-effort:
 * a cache failure never breaks the MCP call. Called by the executor after a
 * read/resolve so the snapshot tracks the latest CRM state the agent saw.
 */
export async function cacheSnapshot(
  api: any,
  userId: string | undefined,
  workflowId: string | undefined,
  partial: Record<string, any>,
): Promise<void> {
  try {
    if (!userId || !workflowId) return;
    const redis = api?.getRedisClient?.();
    if (!redis) return;
    const key = snapshotKey(userId, workflowId);
    let current: Record<string, any> = {};
    const raw = await redis.get(key);
    if (raw) {
      try {
        current = JSON.parse(raw);
      } catch {
        current = {};
      }
    }
    const next = { ...current, ...partial, updatedAt: new Date().toISOString() };
    await redis.set(key, JSON.stringify(next), "EX", SNAPSHOT_TTL_SECONDS);
  } catch {
    // best-effort cache — never throw
  }
}

// The ONLY Contact fields the sync lane will read. Bounded by design.
const PROFILE_FIELDS = ["Id", "Name", "FirstName", "LastName", "Email", "Title", "Phone", "Account.Name"];

// Escape a value for safe interpolation into a SOQL string literal.
function soqlEscape(v: string): string {
  return String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function toProfile(r: any) {
  if (!r) return null;
  return {
    id: r.Id,
    name: r.Name ?? null,
    firstName: r.FirstName ?? null,
    lastName: r.LastName ?? null,
    email: r.Email ?? null,
    title: r.Title ?? null,
    phone: r.Phone ?? null,
    company: r.Account?.Name ?? null,
  };
}

/** Resolve a user (by email) to a Salesforce Contact + their bounded identity. */
export async function crmResolveUser(
  credentials: SalesforceCredentials,
  params: { email?: string },
) {
  const email = params.email?.trim();
  if (!email) {
    // No email to join on. Don't throw (that becomes a 500 and breaks the tool
    // call) — return a structured result the agent can act on.
    return {
      ok: false,
      found: false,
      contactId: null,
      profile: null,
      error:
        "No email to resolve. In production this defaults to the authenticated user; in a debug run, pass the contact's email explicitly.",
    };
  }

  const soql =
    `SELECT ${PROFILE_FIELDS.join(", ")} FROM Contact ` +
    `WHERE Email = '${soqlEscape(email)}' LIMIT 1`;
  const res = await queryRecords(credentials, { soql });
  const record = res.records?.[0];

  return { ok: true, found: !!record, contactId: record?.Id ?? null, profile: toProfile(record) };
}

/** Read a contact's bounded identity profile (fixed allowlist, never SELECT *). */
export async function crmGetProfile(
  credentials: SalesforceCredentials,
  params: { contactId: string },
) {
  const id = params.contactId?.trim();
  if (!id) return { ok: false, profile: null, error: "contactId is required" };

  const soql =
    `SELECT ${PROFILE_FIELDS.join(", ")} FROM Contact ` +
    `WHERE Id = '${soqlEscape(id)}' LIMIT 1`;
  const res = await queryRecords(credentials, { soql });
  const record = res.records?.[0];

  return { ok: !!record, profile: toProfile(record) };
}

/**
 * Append a machine-authored insight to a contact as a completed Task.
 * APPEND-ONLY: this can only create a Task — it cannot edit any existing field.
 */
export async function crmWriteInsight(
  credentials: SalesforceCredentials,
  params: { contactId: string; insight: string; certainty?: number },
) {
  const id = params.contactId?.trim();
  const insight = params.insight?.trim();
  if (!id) return { ok: false, error: "contactId is required" };
  if (!insight) return { ok: false, error: "insight is required" };

  // Task.Subject is capped at 255 chars; keep the full text in Description.
  const subject = insight.length > 255 ? `${insight.slice(0, 252)}…` : insight;
  const certainty =
    typeof params.certainty === "number"
      ? ` (certainty ${Math.round(params.certainty * 100)}%)`
      : "";
  const description = `${AI_STAMP}${certainty}\n\n${insight}`;

  const res = await createRecord(credentials, {
    sobject: "Task",
    fields: { Subject: subject, Status: "Completed", Priority: "Normal", WhoId: id, Description: description },
  });

  return { ok: res.ok, id: res.id };
}

/** Read back the AI-authored insights previously written to a contact. */
export async function crmReadInsights(
  credentials: SalesforceCredentials,
  params: { contactId: string; limit?: number },
) {
  const id = params.contactId?.trim();
  if (!id) return { ok: false, insights: [], error: "contactId is required" };
  const limit = Math.min(Math.max(params.limit ?? 50, 1), 200);

  const soql =
    `SELECT Id, Subject, Description, CreatedDate FROM Task ` +
    `WHERE WhoId = '${soqlEscape(id)}' AND Description LIKE 'Gravity AI%' ` +
    `ORDER BY CreatedDate DESC LIMIT ${limit}`;
  const res = await queryRecords(credentials, { soql });

  return {
    ok: true,
    insights: (res.records ?? []).map((t: any) => ({
      id: t.Id,
      subject: t.Subject,
      description: t.Description,
      createdDate: t.CreatedDate,
    })),
  };
}
