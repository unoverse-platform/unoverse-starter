# Runbook: Core Services

Deploy the core Gravity Platform services to a VM.

## Services Deployed

| Service          | Port | Description                         |
| ---------------- | ---- | ----------------------------------- |
| **server**       | 4100 | API gateway                         |
| **workflow**     | 4101 | XState orchestration engine         |
| **unoverse**     | 4105 | Node plane — authors, distributes, and executes package nodes |
| **mcp-server**   | 4103 | MCP (Model Context Protocol) server |
| **memory**       | 4104 | Evidence-based user memory          |
| **canvas**       | 3001 | Web UI                              |

> **Unoverse has two ports.** `:4105` is the public port (JWT-gated: MCP defs, workbench, `/plugins` management, `/health`). `:4106` is the internal node runtime (`/execute`, `/nodes`, `/skills`, `/health`) — it lives on the Docker network only and is deliberately never published or proxied; network isolation is the trust boundary.

## VM Requirements

| Tier                  | Cores | RAM   | Storage    | Notes                      |
| --------------------- | ----- | ----- | ---------- | -------------------------- |
| **POC**               | 4     | 8 GB  | 100 GB SSD | All services on one VM     |
| **Enterprise App VM** | 8     | 32 GB | 200 GB SSD | 2 VMs for Active/Active HA |

## Prerequisites

- [ ] VM provisioned (Ubuntu 22.04 LTS recommended)
- [ ] SSH access configured (key-based)
- [ ] PostgreSQL database provisioned (see [02-database.md](./02-database.md))
- [ ] Redis provisioned (managed Redis recommended for enterprise)
- [ ] DOCR token for pulling Gravity Docker images (from your Gravity admin)

## Steps

### 1. Configure Production Environment

Copy the example and fill in your values:

```bash
cp .env.production.example .env.production
```

Edit `.env.production` with your credentials:

```bash
# Deploy target
DEPLOY_HOST=<YOUR_VM_IP>
DEPLOY_USER=root              # Azure: azureuser, AWS: ubuntu, GCP: debian

# DOCR - DigitalOcean Container Registry
DOCR_TOKEN=dop_v1_your_token_here

# Database and Redis
DATABASE_URL=postgresql://user:pass@host:5432/gravity
REDIS_HOST=your-redis-host
REDIS_PORT=25061              # DO Managed Redis uses 25061; local Redis uses 6379
REDIS_PASSWORD=your-redis-password
REDIS_TLS=true

# Domain (for HTTPS)
DOMAIN=yourdomain.com
```

> **Note:** `.env.production` is gitignored — it will not be overwritten when you run `gravity update`. Only the `.example` file is tracked in git.

> **Do not set `ansible_become_password` or `ansible_become_flags`** for cloud VMs. Their default users already have passwordless sudo configured by the cloud provider.

### 2. Run Core Platform Installation

```bash
gravity deploy
```

Or manually via Ansible:

```bash
cd ansible
ansible-playbook -i inventory/production.yml playbooks/install.yml
```

This installs Docker, Node.js, pulls DOCR images, and starts **core platform** (server, workflow, unoverse, mcp-server, memory, canvas).

### 3. Deploy Customer Packages

Rsyncs packages from your local machine to the server, builds them, and restarts unoverse:

```bash
gravity deploy packages
```

Or manually:

```bash
cd ansible
ansible-playbook -i inventory/production.yml playbooks/deploy-packages.yml
```

### 4. Verify

```bash
gravity deploy test
```

Or manually:

```bash
cd ansible
ansible-playbook -i inventory/production.yml playbooks/test-connectivity.yml
```

## Expected Output

```
GRAVITY PLATFORM DEPLOYED
============================================
Host: gravity-prod (<YOUR_VM_IP>)

Service Health:
  - Server:       OK
  - Workflow:      OK
  - Unoverse:      OK
  - MCP Server:    OK
  - Memory:        OK
  - Canvas:        OK

Access URLs:
  - Canvas:  http://<YOUR_VM_IP>:3001
  - API:     http://<YOUR_VM_IP>:4100

Internal Only (SSH tunnel required):
  - Memory:  http://localhost:4104/dashboard
```

> **Memory dashboard is internal-only.** Access via SSH tunnel: `ssh -L 4104:localhost:4104 root@<VM_IP>` then open `http://localhost:4104/dashboard`. It is NOT exposed via Caddy.

## Troubleshooting

| Issue               | Cause            | Fix                                            |
| ------------------- | ---------------- | ---------------------------------------------- |
| DOCR login failed   | Invalid token    | Get a new DOCR token from your Gravity admin   |
| Service unhealthy   | Missing env vars | Check `.env.production` and `/opt/gravity/.env` on VM |
| Port already in use | Previous install | Run `docker compose down` first                |
| `Timeout (12s) waiting for privilege escalation prompt` | `ansible_become_password` set to empty string in inventory | Remove `ansible_become_password` and `ansible_become_flags` from inventory entirely — cloud default users (azureuser, ubuntu) have passwordless sudo and need no password |

## Next Steps

- [02-database.md](./02-database.md) - Configure database connection
- Run `deploy-packages.yml` to deploy custom nodes and design system
