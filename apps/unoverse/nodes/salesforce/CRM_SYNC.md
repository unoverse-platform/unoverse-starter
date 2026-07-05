# CRM Sync Contract — Salesforce implementation

> Salesforce's implementation of the **CRM-agnostic** sync contract. The contract
> itself (the four methods, the two rails, the snapshot cache, the email join) is
> spec'd once, CRM-neutrally, in **`docs/architecture/CRM_SYNC_CONTRACT.md`** — read
> that first. This doc covers only the Salesforce *specifics*: SOQL, `Contact` /
> `Task`, and the `Gravity AI` marker.

Every CRM touch by the memory feature (agent + memory page) goes through these four
methods — never hand-built SOQL — so calls are consistent and the safety rails are
enforced in code, not in prompts.

The raw primitives (`query_records`, `get_record`, `create_record`, `update_record`,
`describe_object`, `list_objects`) still exist for arbitrary agent CRM work. The four
methods below are the **dedicated, safety-railed lane** for the memory sync.

---

## The two guarantees

1. **Reads are bounded.** Profile reads return a fixed identity allowlist —
   `Id, Name, FirstName, LastName, Email, Title, Phone, Account.Name` — never `SELECT *`,
   never a sensitive field.
2. **Writes are append-only.** `crm_write_insight` can *only* create a Task. There is
   no code path in this lane to `update_record` or to write a Contact / core profile
   field. The "never edit core profile data" rule is enforced here, in code — not left
   to the model's judgement.

---

## The four methods

### `crm_resolve_user({ email? })`
Resolve a user to their Salesforce Contact **by email** — the identity join. The
Gravity `userId` never matches the CRM; email does (`Contact.Email`). `email`
defaults to the **authenticated user's email** (`context.auth.user.email`, from
Auth0), so the agent normally calls this with no arguments.

```
→ { ok, found, contactId, profile: { id, name, firstName, lastName, email, title, phone, company } | null }
```

### `crm_get_profile({ contactId })`
Read a contact's **bounded** identity profile (the allowlist above).

```
→ { ok, profile: { id, name, firstName, lastName, email, title, phone, company } | null }
```

### `crm_write_insight({ contactId, insight, certainty? })`
Append one machine-authored insight as a **completed Task** on the contact (shows in
the activity timeline). `certainty` (0.0–1.0) is stamped into the note. Append-only.

- `Subject` = the insight (truncated to 255 chars)
- `Status` = `Completed`, `WhoId` = the contact
- `Description` = `"Gravity AI — machine-authored, unverified" [+ certainty] + full insight`

```
→ { ok, id }
```

### `crm_read_insights({ contactId, limit? })`
Read back the AI-authored insights previously written (the Tasks `crm_write_insight`
created, identified by the `Gravity AI` Description stamp). `limit` default 50, max 200.

```
→ { ok, insights: [ { id, subject, description, createdDate } ] }
```

---

## How the memory sync uses it

| Direction | Call | When |
| --- | --- | --- |
| **Import** | `crm_resolve_user` → `crm_get_profile` | conversation start — ground the agent in CRM identity |
| **Hydrate** | `crm_write_insight` | on a new high-certainty conclusion about the user |
| **Read-back** | `crm_read_insights` | when displaying / before re-writing, to avoid duplicates |

The CRM stays the single source of truth for both directions.

### Snapshot cache (for dashboards)

`crm_resolve_user`, `crm_get_profile`, and `crm_read_insights` each refresh a
short-lived snapshot in Redis so a UI can show the imported identity + synced
insights **without holding CRM credentials or calling Salesforce itself**:

- **Key:** `crm:{userId}:{workflowId}` (scoped by Gravity `userId` — what the memory
  page has; the email is only for the CRM lookup, never the cache key). The node
  prepends `${REDIS_NAMESPACE}:` so the memory server's namespaced client reads the
  same key.
- **TTL:** 600s (10 min), reset on every read. PII evaporates 10 min after the last
  sync — nothing CRM-derived is ever persisted to Postgres.
- **Shape:** `{ contact: {…identity}, insights: [{ subject, createdDate }], updatedAt }`.

The memory page reads it via the memory server's `GET /api/crm/snapshot` (which only
reads this Redis key — it never calls the CRM). Cold cache = normal empty state.

## Append-only by construction

`crm_write_insight` always creates a `Task`. To extend it (e.g. a custom field
target), keep the append-only guarantee: do not add a path that updates an existing
record's core fields from this lane. Edits to ground-truth profile data are out of
scope for the memory sync — that data is the CRM's to own.
