#!/usr/bin/env bash
# gravity db-verify
# Verifies all required tables and columns exist in the database.
# Derived from the Prisma schema (source of truth).

cmd_db_verify() {
  banner "Database Verification"

  # Load DATABASE_URL from .env
  local db_url
  db_url=$(grep "^DATABASE_URL=" "$ROOT/.env" 2>/dev/null | cut -d'=' -f2-)
  if [ -z "$db_url" ]; then
    fail "DATABASE_URL not found in .env"
    exit 1
  fi

  local verify_script='
    const { Pool } = require("pg");
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    // ── Source of truth: every table + required columns (from Prisma schema) ──
    const schema = {
      workflows: [
        "id", "name", "description", "nodes", "edges", "active",
        "execution_mode", "test_inputs", "umap_settings", "viewport",
        "mcp_schema", "memory_config", "created_at", "updated_at"
      ],
      workflow_executions: [
        "execution_id", "workflow_id", "status", "start_time", "end_time",
        "duration", "error", "result", "created_at", "was_from_cache", "source"
      ],
      node_traces: [
        "trace_id", "execution_id", "node_id", "node_type", "start_time",
        "end_time", "duration", "ttft_ms", "status", "inputs", "outputs",
        "error", "created_at"
      ],
      credentials: [
        "id", "name", "type", "scope", "data", "created_at", "updated_at"
      ],
      token_usage: [
        "id", "workflow_id", "execution_id", "node_id", "node_type",
        "model", "usage", "timestamp", "created_at"
      ],
      raw_messages: [
        "id", "user_id", "workflow_id", "conversation_id", "chat_id",
        "user_message", "assistant_message", "created_at", "processed_at",
        "grade", "note", "graded_at", "eval_score", "eval_reasoning",
        "eval_ran_at", "execution_id", "eval_run_id"
      ],
      user_profiles: [
        "id", "user_id", "workflow_id", "profile", "insights", "raw_data",
        "metadata", "created_at", "updated_at"
      ],
      memories: [
        "id", "user_id", "workflow_id", "memory_id", "content",
        "source_conversation_id", "created_at", "updated_at", "type",
        "domain", "certainty", "reinforcement_count", "last_reinforced",
        "supports", "contradicts", "supersedes"
      ],
      analytics_events: [
        "id", "user_id", "workflow_id", "memory_id", "actual_user_id",
        "event_data", "timestamp"
      ],
      eval_runs: [
        "id", "workflow_id", "user_id", "history_window", "sample_pct",
        "sampled_count", "avg_score", "great_count", "okay_count",
        "poor_count", "status", "judge_model", "created_at", "completed_at"
      ],
      node_definitions: [
        "id", "name", "description", "category", "color", "logo_url",
        "definition", "created_at", "updated_at"
      ],
      service_definitions: [
        "id", "provider", "name", "description", "methods", "metadata",
        "source", "created_at", "updated_at"
      ],
      dictionary_need_states: [
        "universal_id", "content_hash", "title", "description", "object_type",
        "needs", "source_url", "umap_x", "umap_y", "umap_z",
        "umap_cluster_id", "color_hex", "needs_umap_update", "created_at",
        "updated_at", "workflow_id", "key_need", "metadata"
      ],
      dictionary_content_chunks: [
        "chunk_id", "text", "source_url", "source_type", "metadata",
        "workflow_id", "created_at", "updated_at"
      ],
      dictionary_chunk_need_matches: [
        "chunk_id", "need_id", "similarity_score", "rank", "match_type",
        "created_at", "workflow_id"
      ],
      dictionary_ingestion_configs: [
        "id", "name", "description", "connector_type", "connector_config",
        "main_category", "workflow_id", "created_at", "updated_at",
        "last_run_at", "run_count"
      ],
      dictionary_ingestion_jobs: [
        "job_id", "workflow_id", "status", "connector_type", "category",
        "config", "extraction_config", "started_at", "completed_at",
        "progress", "error", "created_at"
      ],
      security_attack_corpus: [
        "id", "category", "label", "attack_prompt", "expected_result",
        "severity", "source", "is_active", "created_at"
      ],
      security_run_results: [
        "id", "run_id", "corpus_attack_id", "category", "severity",
        "attack_prompt", "agent_response", "result", "judge_reasoning",
        "judged_at"
      ]
    };

    (async () => {
      let tableOk = 0, tableFail = 0, colOk = 0, colFail = 0;
      const missing = [];

      // Get all existing tables
      const tablesRes = await pool.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = $1",
        ["public"]
      );
      const existingTables = new Set(tablesRes.rows.map(r => r.table_name));

      for (const [table, columns] of Object.entries(schema)) {
        if (!existingTables.has(table)) {
          console.log("  \u2717 " + table + " — TABLE MISSING");
          tableFail++;
          missing.push({ table, column: null });
          continue;
        }
        tableOk++;

        // Get columns for this table
        const colsRes = await pool.query(
          "SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2",
          ["public", table]
        );
        const existingCols = new Set(colsRes.rows.map(r => r.column_name));

        const missingCols = columns.filter(c => !existingCols.has(c));
        if (missingCols.length > 0) {
          console.log("  \u2717 " + table + " — missing columns: " + missingCols.join(", "));
          colFail += missingCols.length;
          colOk += columns.length - missingCols.length;
          for (const c of missingCols) missing.push({ table, column: c });
        } else {
          console.log("  \u2713 " + table + " (" + columns.length + " columns)");
          colOk += columns.length;
        }
      }

      console.log("");
      const totalTables = Object.keys(schema).length;
      console.log("  Tables: " + tableOk + "/" + totalTables + " ok");
      console.log("  Columns: " + colOk + "/" + (colOk + colFail) + " ok");

      if (missing.length > 0) {
        console.log("");
        console.log("  MISSING (" + missing.length + "):");
        for (const m of missing) {
          if (m.column) {
            console.log("    ALTER TABLE " + m.table + " ADD COLUMN IF NOT EXISTS " + m.column + " — needs migration");
          } else {
            console.log("    CREATE TABLE " + m.table + " — run ./gravity db-setup");
          }
        }
        process.exit(1);
      } else {
        console.log("");
        console.log("  All tables and columns verified.");
        process.exit(0);
      }

      await pool.end();
    })().catch(e => { console.error(e.message); process.exit(1); });
  '

  echo ""

  if [ -d "$ROOT/apps/workflow" ]; then
    # Local dev — run directly
    NODE_TLS_REJECT_UNAUTHORIZED=0 DATABASE_URL="$db_url" node --no-warnings -e "$verify_script" 2>&1
  else
    # Starter/Docker — exec into workflow container
    if ! docker compose -f "$ROOT/docker-compose.yml" ps --status running workflow 2>/dev/null | grep -q workflow; then
      fail "workflow service not running — start it first"
      exit 1
    fi
    docker compose -f "$ROOT/docker-compose.yml" exec -T \
      -e NODE_TLS_REJECT_UNAUTHORIZED=0 workflow node --no-warnings -e "$verify_script" 2>&1
  fi

  local verify_exit=$?
  echo ""
  if [ $verify_exit -eq 0 ]; then
    ok "Database schema verified"
  else
    fail "Database schema has issues — re-run ${BOLD}./gravity db-setup${NC}"
  fi
  return $verify_exit
}
