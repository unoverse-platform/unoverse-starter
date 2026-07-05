import { salesforceApi, type SalesforceCredentials } from "../../shared/salesforceClient";

/**
 * Run a SOQL query.
 * Source flow: flows/Salesforce/Query/Query.json — GET /query?q=<SOQL>
 * Returns only the first page; surfaces has_more + next_records_url for pagination.
 */
export async function queryRecords(
  credentials: SalesforceCredentials,
  params: { soql: string },
) {
  if (!params.soql) throw new Error("soql is required");

  const result = await salesforceApi(credentials, "/query", {
    method: "GET",
    query: { q: params.soql },
  });

  return {
    ok: true,
    totalSize: result.totalSize,
    records: result.records ?? [],
    has_more: result.done === false,
    next_records_url: result.nextRecordsUrl ?? null,
  };
}

/**
 * Fetch a single record by ID.
 * Source flow: flows/Salesforce/Records/Get Field Values from a Standard Object Record.json
 * GET /sobjects/{sObject}/{recordId}?fields=<csv>
 */
export async function getRecord(
  credentials: SalesforceCredentials,
  params: { sobject: string; recordId: string; fields?: string },
) {
  if (!params.sobject || !params.recordId) {
    throw new Error("sobject and recordId are required");
  }

  const record = await salesforceApi(
    credentials,
    `/sobjects/${encodeURIComponent(params.sobject)}/${encodeURIComponent(params.recordId)}`,
    {
      method: "GET",
      query: params.fields ? { fields: params.fields } : undefined,
    },
  );

  return { ok: true, record };
}

/**
 * Create a record.
 * Source flow: flows/Salesforce/Records/Create a Record.json
 * POST /sobjects/{sObject}/ with the field body
 */
export async function createRecord(
  credentials: SalesforceCredentials,
  params: { sobject: string; fields: Record<string, any> },
) {
  if (!params.sobject || !params.fields) {
    throw new Error("sobject and fields are required");
  }

  const result = await salesforceApi(
    credentials,
    `/sobjects/${encodeURIComponent(params.sobject)}/`,
    { method: "POST", body: params.fields },
  );

  return { ok: !!result?.success, id: result?.id ?? null, errors: result?.errors ?? [] };
}

/**
 * Update a record.
 * Source flow: flows/Salesforce/Records/Update a Record.json
 * PATCH /sobjects/{sObject}/{recordId} with the changed field body (returns 204)
 */
export async function updateRecord(
  credentials: SalesforceCredentials,
  params: { sobject: string; recordId: string; fields: Record<string, any> },
) {
  if (!params.sobject || !params.recordId || !params.fields) {
    throw new Error("sobject, recordId, and fields are required");
  }

  await salesforceApi(
    credentials,
    `/sobjects/${encodeURIComponent(params.sobject)}/${encodeURIComponent(params.recordId)}`,
    { method: "PATCH", body: params.fields },
  );

  return { ok: true, id: params.recordId };
}

/**
 * Describe an object's fields and metadata.
 * Source flow: flows/Salesforce/Object Metadata/Get Field and Other Metadata for an Object (Describe).json
 * GET /sobjects/{sObject}/describe/
 */
export async function describeObject(
  credentials: SalesforceCredentials,
  params: { sobject: string },
) {
  if (!params.sobject) throw new Error("sobject is required");

  const result = await salesforceApi(
    credentials,
    `/sobjects/${encodeURIComponent(params.sobject)}/describe/`,
    { method: "GET" },
  );

  // The full describe payload is huge; return the fields agents actually reason about.
  return {
    ok: true,
    name: result.name,
    label: result.label,
    fields: (result.fields ?? []).map((f: any) => ({
      name: f.name,
      label: f.label,
      type: f.type,
      required: f.nillable === false && f.defaultedOnCreate === false,
      updateable: f.updateable,
      picklistValues: (f.picklistValues ?? []).map((p: any) => p.value),
    })),
  };
}

/**
 * List the org's available objects (sObjects).
 * Source flow: flows/Salesforce/My Organization/Get a List of Objects.json
 * GET /sobjects/
 */
export async function listObjects(credentials: SalesforceCredentials) {
  const result = await salesforceApi(credentials, "/sobjects/", { method: "GET" });

  return {
    ok: true,
    sobjects: (result.sobjects ?? []).map((s: any) => ({
      name: s.name,
      label: s.label,
      queryable: s.queryable,
      createable: s.createable,
      updateable: s.updateable,
    })),
  };
}
