---
sidebarTitle: "Database Setup"
title: "Runbook: Database Setup"
---

Create database tables and schema.

## Overview

Gravity Platform requires a PostgreSQL database. The database is **always customer-managed** — it is never bundled with the platform.

The `DATABASE_URL` is configured in `.env.production` and deployed to the server with `unoverse deploy`. This runbook creates the required database tables.

## Prerequisites

- [ ] Core services deployed ([01-core.md](./01-core.md))
- [ ] `DATABASE_URL` configured in `.env.production`
- [ ] PostgreSQL instance accessible from VM (firewall allows database port — typically 25060 for DO Managed, 5432 for self-hosted)
- [ ] **Required extensions enabled** (see Step 1 below)

## Database Requirements

| Requirement        | Value                          |
| ------------------ | ------------------------------ |
| PostgreSQL version | 14+                            |
| Database name      | `gravity`                      |
| SSL                | Required for managed databases |
| Min connections    | 20                             |

## Steps

### 1. Enable Required PostgreSQL Extensions

**You must enable these extensions before running db-setup.** The playbook cannot install them — they must be enabled at the database provider level.

| Extension            | Required By               | Purpose                      |
| -------------------- | ------------------------- | ---------------------------- |
| `vector`             | GravityMemory, Dictionary | Vector embeddings (pgvector) |
| `pg_stat_statements` | Executions                | Query performance monitoring |

#### DigitalOcean Managed Database

1. Go to **DigitalOcean Dashboard** → **Databases** → select your database
2. Click **Settings** tab
3. Scroll to **Allowed Extensions** (or **Extensions**)
4. Search and enable: `vector`, `pg_stat_statements`
5. Wait for the database to apply changes (~1 minute)

#### AWS RDS

Connect to your database and run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

#### Self-hosted

```bash
sudo apt install postgresql-14-pgvector
sudo -u postgres psql -d gravity -c 'CREATE EXTENSION IF NOT EXISTS vector;'
sudo -u postgres psql -d gravity -c 'CREATE EXTENSION IF NOT EXISTS pg_stat_statements;'
```

### 2. Run Database Setup

```bash
cd ansible
ansible-playbook -i inventory/production.yml playbooks/db-setup.yml
```

This creates all required tables:

- **workflows** — workflow definitions
- **executions** — workflow execution history and node traces
- **credentials** — encrypted credential storage
- **token_usage** — LLM token tracking
- **gravity_memory** — vector memory store
- **dictionary** — dictionary with UMAP coordinates

### 3. Verify

```bash
# Check service health
curl https://your-domain.com/api/health

# Or via Ansible
ansible-playbook -i inventory/production.yml playbooks/health-check.yml

# Full connectivity test (includes DB, Redis, API endpoints)
ansible-playbook -i inventory/production.yml playbooks/test-connectivity.yml
```

## Expected Output

```
DATABASE MIGRATION
============================================
Host: gravity-prod (<YOUR_VM_IP>)
Extensions: OK
Migration: OK

Tables created:
  - Workflows: OK
  - Executions: OK
  - Credentials: OK
  - TokenUsage: OK
  - GravityMemory: OK
  - Dictionary: OK
```

## Troubleshooting

| Issue              | Cause                      | Fix                                        |
| ------------------ | -------------------------- | ------------------------------------------ |
| Connection refused | Firewall blocking          | Add VM IP to database trusted sources      |
| SSL required       | Missing `?sslmode=require` | Add SSL mode to connection string          |
| Auth failed        | Wrong credentials          | Verify username/password in DO/AWS console |
| Database not found | DB not created             | Create `gravity` database manually         |

## Creating Database Manually

If the database doesn't exist:

```sql
CREATE DATABASE gravity;
```

## Database Migration

To migrate data between database providers (e.g., Timescale → DigitalOcean):

```bash
cd ansible
ansible-playbook -i inventory/production.yml playbooks/migrate-db.yml \
  -e 'source_db=postgres://user:pass@source-host:port/db?sslmode=require' \
  -e 'target_db=postgres://user:pass@target-host:port/db?sslmode=require'
```

This will:

1. Install PostgreSQL 17 client tools (if needed)
2. `pg_dump` the source database (read-only — source is not modified)
3. Enable `vector` and `pg_stat_statements` extensions on target
4. `pg_restore` to the target database
5. Update `/opt/gravity/.env` with the new `DATABASE_URL`
6. Restart the unoverse service

**Note:** Timescale-specific errors (continuous_agg, bgw_job) during restore are expected and harmless — all application tables migrate correctly.

After migration, verify with:

```bash
ansible-playbook -i inventory/production.yml playbooks/test-connectivity.yml
```

## Next Steps

- [03-ai-model.md](./03-ai-model.md) - Deploy UMAP AI service
- [04-harden.md](./04-harden.md) - Security hardening
