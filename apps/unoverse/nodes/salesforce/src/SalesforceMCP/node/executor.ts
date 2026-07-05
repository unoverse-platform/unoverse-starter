import {
  getPlatformDependencies,
  type NodeExecutionContext,
} from "@unoverse-platform/plugin-base";
import type { SalesforceCredentials } from "../../shared/salesforceClient";
import {
  queryRecords,
  getRecord,
  createRecord,
  updateRecord,
  describeObject,
  listObjects,
} from "../service";
import {
  crmResolveUser,
  crmGetProfile,
  crmWriteInsight,
  crmReadInsights,
  cacheSnapshot,
  syncUserSnapshot,
  drainHydrateOutbox,
} from "../service/crmSync";
import { SalesforceMCPSchema } from "../service/mcpSchema";

const { PromiseNode } = getPlatformDependencies();

const NODE_TYPE = "SalesforceMCP";

const KNOWN_METHODS = new Set([
  "getSchema",
  "query_records",
  "get_record",
  "create_record",
  "update_record",
  "describe_object",
  "list_objects",
  // CRM Sync contract
  "crm_resolve_user",
  "crm_get_profile",
  "crm_write_insight",
  "crm_read_insights",
]);

export default class SalesforceMCPExecutor extends PromiseNode {
  constructor() {
    super(NODE_TYPE);
  }

  private getCredentials(context: NodeExecutionContext): SalesforceCredentials {
    const available = (context as any).credentials || {};

    let creds: any;
    for (const val of Object.values(available)) {
      if ((val as any)?.clientId && (val as any)?.clientSecret && (val as any)?.host) {
        creds = val;
        break;
      }
    }

    if (!creds?.clientId || !creds?.clientSecret || !creds?.host) {
      throw new Error(
        "Salesforce credential is not configured (need host + clientId + clientSecret)",
      );
    }

    return {
      host: creds.host,
      clientId: creds.clientId,
      clientSecret: creds.clientSecret,
      apiVersion: creds.apiVersion,
    };
  }

  protected async executeNode(
    inputs: Record<string, any>,
    config: any,
    context: NodeExecutionContext,
  ): Promise<any> {
    const credentials = this.getCredentials(context);

    // User-sync mode (deterministic CRM import). Wired off the conversation
    // trigger, this resolves the authenticated user and refreshes the Redis
    // snapshot — but cache-aside, so it only hits Salesforce when the snapshot is
    // cold (first seen, or 10-min TTL expired). No agent / LLM involved.
    if (config.syncUser) {
      const api = (context as any).api;
      const pub = (context as any).publishingContext || {};
      const wfVars = (context as any).workflow?.variables || {};
      const userId = pub.userId || wfVars.userId;
      const workflowId = (context as any).workflowId || (context as any).workflow?.id;
      const email = (context as any).auth?.user?.email;
      const result = await syncUserSnapshot(api, userId, workflowId, credentials, email);
      // Hydrate (memory → CRM): drain any high-certainty L3 deductions the memory server
      // queued, writing them back as append-only Tasks on the contact. No-op if empty.
      const hydrated = await drainHydrateOutbox(api, userId, workflowId, credentials, (result as any).contactId);
      return { __outputs: { output: { ...result, hydrated } } };
    }

    // Only treat an input as SOQL if it's actually a non-empty string. A wired
    // upstream node often passes an object/array on `input`; stringifying that
    // would send "[object Object]" to Salesforce. Fall back to the configured
    // default query instead of sending garbage.
    const asQuery = (v: unknown): string | undefined =>
      typeof v === "string" && v.trim() ? v.trim() : undefined;

    const soql = asQuery(inputs.soql) ?? asQuery(inputs.input) ?? asQuery(config.defaultQuery);

    if (!soql) {
      return {
        __outputs: {
          output: {
            ok: false,
            error:
              "No SOQL query provided. Set the node's Default SOQL Query, or pass a query string into `soql`/`input`.",
          },
        },
      };
    }

    const result = await queryRecords(credentials, { soql });

    return {
      __outputs: {
        output: result,
      },
    };
  }

  async handleServiceCall(
    method: string,
    params: any,
    _config: any,
    context: NodeExecutionContext,
  ): Promise<any> {
    if (method === "getSchema") {
      return SalesforceMCPSchema;
    }

    if (!KNOWN_METHODS.has(method)) {
      return {
        ok: false,
        error: "UNKNOWN_METHOD",
        hint: `Unknown method '${method}'. Available: query_records, get_record, create_record, update_record, describe_object, list_objects.`,
      };
    }

    const credentials = this.getCredentials(context);
    const p = params || {};

    // Identity for the snapshot cache (resolved from execution context). Mirror
    // the resolution SmartDocument uses — in the service-call path userId lives on
    // publishingContext, not workflow.variables.
    const api = (context as any).api;
    const pubContext = (context as any).publishingContext || {};
    const workflowVars = (context as any).workflow?.variables || {};
    const userId = pubContext.userId || workflowVars.userId;
    const workflowId = (context as any).workflowId || (context as any).workflow?.id;

    switch (method) {
      case "query_records":
        return queryRecords(credentials, p);
      case "get_record":
        return getRecord(credentials, p);
      case "create_record":
        return createRecord(credentials, p);
      case "update_record":
        return updateRecord(credentials, p);
      case "describe_object":
        return describeObject(credentials, p);
      case "list_objects":
        return listObjects(credentials);
      // CRM Sync contract — standardized, safety-railed lane.
      // Reads/resolves also refresh a short-lived Redis snapshot (crm:{uid}:{wid},
      // 10 min) so dashboards can show the imported identity + synced insights
      // without calling Salesforce themselves.
      case "crm_resolve_user": {
        // Join to Salesforce by EMAIL — the Gravity userId never matches the CRM.
        // Default to the authenticated user's email (Auth0, via context.auth) so the
        // agent doesn't have to know or pass it.
        const email = p.email || (context as any).auth?.user?.email;
        const result = await crmResolveUser(credentials, { email });
        await cacheSnapshot(api, userId, workflowId, { contact: result.profile });
        return result;
      }
      case "crm_get_profile": {
        const result = await crmGetProfile(credentials, p);
        await cacheSnapshot(api, userId, workflowId, { contact: result.profile });
        return result;
      }
      case "crm_write_insight":
        return crmWriteInsight(credentials, p);
      case "crm_read_insights": {
        const result = await crmReadInsights(credentials, p);
        await cacheSnapshot(api, userId, workflowId, { insights: result.insights });
        return result;
      }
    }
  }
}
