# Runbook: Core Services

Deploy the core Gravity Platform services to a VM.

## Services Deployed

| Service          | Port | Description                         |
| ---------------- | ---- | ----------------------------------- |
| **server**       | 4100 | API gateway                         |
| **workflow**     | 4101 | XState orchestration engine         |
| **node-service** | 4102 | Node execution service              |
| **mcp-server**   | 4103 | MCP (Model Context Protocol) server |
| **memory**       | 4104 | Evidence-based user memory          |
| **canvas**       | 3001 | Web UI                              |

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

### 1. Configure Ansible Inventory

Copy the example inventory and fill in your VM details:

```bash
cp ansible/inventory/production.yml.example ansible/inventory/production.yml
```

Then edit `ansible/inventory/production.yml`:

**If your VM allows direct root SSH login** (e.g. DigitalOcean droplets with root key):
```yaml
all:
  children:
    app_vms:
      hosts:
        app-vm-1:
          ansible_host: <YOUR_VM_IP>
          ansible_user: root
```

**If your VM uses a default non-root user with passwordless sudo** (e.g. Azure `azureuser`, AWS `ubuntu`, GCP `debian`):
```yaml
all:
  children:
    app_vms:
      hosts:
        app-vm-1:
          ansible_host: <YOUR_VM_IP>
          ansible_user: azureuser   # or ubuntu, debian, etc.
```

> **Do not set `ansible_become_password` or `ansible_become_flags`** for these cloud VMs. Their default users already have passwordless sudo configured by the cloud provider. Adding an empty password (`ansible_become_password: ""`) will cause a 12s timeout error. The `ansible.cfg` in this repo handles privilege escalation automatically.

> **Note:** `production.yml` is gitignored — it will not be overwritten when you run `gravity update`. Only the `.example` file is tracked in git.

### 2. Configure Environment File

Copy the example and fill in your values:

```bash
cp ansible/files/.env.example ansible/files/.env
```

Edit `ansible/files/.env` with your credentials:

```bash
# DOCR - DigitalOcean Container Registry
DOCR_TOKEN=dop_v1_your_token_here

# Database and Redis
DATABASE_URL=postgresql://user:pass@host:5432/gravity
REDIS_HOST=your-redis-host
REDIS_PORT=25061  # DO Managed Redis uses 25061; local Redis uses 6379
REDIS_PASSWORD=your-redis-password
```

### 3. Run Core Platform Installation

```bash
cd ansible
ansible-playbook -i inventory/production.yml playbooks/install.yml
```

This installs Docker, Node.js, pulls DOCR images, and starts **core platform** (server, workflow, node-service, mcp-server, memory, canvas).

### 4. Deploy Customer Packages

Clones your `starter_repo` (set in `production.yml`), builds packages on the server, and restarts node-service:

```bash
ansible-playbook -i inventory/production.yml playbooks/deploy-packages.yml
```

### 5. Verify

```bash
# Quick health check
ansible-playbook -i inventory/production.yml playbooks/health-check.yml

# Full connectivity test (includes DB, Redis, API endpoints)
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
  - Node Service:  OK
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
| Service unhealthy   | Missing env vars | Check `.env` file on VM at `/opt/gravity/.env` |
| Port already in use | Previous install | Run `docker compose down` first                |
| `Timeout (12s) waiting for privilege escalation prompt` | `ansible_become_password` set to empty string in inventory | Remove `ansible_become_password` and `ansible_become_flags` from inventory entirely — cloud default users (azureuser, ubuntu) have passwordless sudo and need no password |

## Next Steps

- [02-database.md](./02-database.md) - Configure database connection
- Run `deploy-packages.yml` to deploy custom nodes and design system
