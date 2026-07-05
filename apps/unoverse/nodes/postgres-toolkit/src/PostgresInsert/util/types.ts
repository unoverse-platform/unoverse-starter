export interface PostgresInsertConfig {
  connectionString: string;
  tableName: string;
  records: any;
  dedupFields?: string;
  batchSize?: number;
  enableVector?: boolean;
  vectorTextField?: string;
}

export interface PostgresInsertOutput {
  success: boolean;
  inserted: number;
  skipped: number;
  tableName: string;
  errors: string[];
}

// Core Gravity tables — INSERT is blocked when targeting the Gravity DB
export const PROTECTED_TABLES = [
  "workflows",
  "workflow_executions",
  "node_traces",
  "credentials",
  "simple_token_usage",
  "raw_messages",
  "user_profiles",
  "memories",
  "analytics_events",
  "eval_runs",
  "dictionary_need_states",
  "dictionary_content_chunks",
  "dictionary_ingestion_configs",
  "dictionary_ingestion_jobs",
  "_prisma_migrations",
];
