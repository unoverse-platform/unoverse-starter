---
sidebarTitle: "AI Model (UMAP)"
title: "Runbook: AI Model (UMAP)"
---

Deploy the UMAP AI service for **Spatial** search and 3D dictionary visualization.

## Overview

UMAP (Uniform Manifold Approximation and Projection) converts 1536-dimensional OpenAI embeddings into 3D coordinates for:

- **Spatial search** — find dictionary entries near a query point in 3D space
- **3D visualization** — render the dictionary as an explorable 3D map in **Canvas**
- **MCP discovery** — **Spatial** proximity for tool/capability matching

UMAP is separate from **vector search** (which uses pgvector for direct 1536D similarity). Both search types serve different purposes and coexist.

## VM Requirements

| Tier                 | Cores | RAM   | Storage    | Notes                            |
| -------------------- | ----- | ----- | ---------- | -------------------------------- |
| **POC**              | —     | —     | —          | Runs on same VM as core services |
| **Enterprise ML VM** | 4     | 16 GB | 100 GB SSD | Dedicated VM for AI workloads    |

## Prerequisites

- [ ] Core services deployed ([01-core.md](./01-core.md))
- [ ] Database configured ([02-database.md](./02-database.md))
- [ ] For Enterprise: Dedicated ML VM provisioned

## Deployment Modes

The `install-umap.yml` playbook **auto-detects** the deployment mode:

| Mode       | Detection                                | What happens                                    |
| ---------- | ---------------------------------------- | ----------------------------------------------- |
| POC        | `/opt/gravity/docker-compose.yml` exists | Runs `docker compose up -d umap` (same network) |
| Enterprise | No `docker-compose.yml` on target        | Runs standalone container on dedicated ML VM    |

| Mode       | UMAP_SERVICE_URL                       | Docker network                  |
| ---------- | -------------------------------------- | ------------------------------- |
| POC        | `http://umap:5001` (set in compose)    | Same network as unoverse (auto) |
| Enterprise | `http://<ML_VM_IP>:5001` (set in .env) | Host networking on ML VM        |

## Steps

### Install UMAP

```bash
cd ansible

# POC (same VM as core services) — auto-detected
ansible-playbook -i inventory/production.yml playbooks/install-umap.yml

# Enterprise (dedicated ML VM)
ansible-playbook -i inventory/production.yml playbooks/install-umap.yml -l ml_vms
```

The playbook will:

1. Install Docker (if needed)
2. Detect POC vs Enterprise mode
3. **POC:** Remove any standalone UMAP container, then `docker compose pull umap && docker compose up -d umap`
4. **Enterprise:** Pull image from DOCR, start standalone container with 2GB memory limit
5. Health check on port 5001

### Enterprise Only: Configure App VMs

For Enterprise mode, update `.env` on App VMs:

```
UMAP_SERVICE_URL=http://<ML_VM_PRIVATE_IP>:5001
```

Add ML VM to inventory:

```yaml
# ansible/inventory/production.yml
ml_vms:
  hosts:
    ml-1:
      ansible_host: <ML_VM_PRIVATE_IP>
      ansible_user: root
```

### Verify

```bash
# Health check
curl http://localhost:5001/health

# Full platform check (includes UMAP port, health, and Docker DNS)
ansible-playbook -i inventory/production.yml playbooks/test-connectivity.yml
```

The `test-connectivity.yml` playbook checks:

- UMAP port 5001 is open
- UMAP `/health` endpoint returns 200
- The unoverse container can resolve `umap:5001` via Docker DNS (POC mode)

## Expected Output

```
UMAP SERVICE DEPLOYED
============================================
Host: gravity-prod (134.209.106.203)

Health: OK

Internal URL: http://134.209.106.203:5001
============================================
```

## How Spatial Search Works

1. User submits a search query
2. The unoverse platform runtime handles it (`/dictionary/search`)
3. The engine generates a 1536D embedding via OpenAI
4. The engine sends the embedding to the UMAP service (`http://umap:5001/transform`)
5. UMAP returns 3D coordinates `[x, y, z]`
6. The engine queries `dictionary_need_states` table using Euclidean distance:
   ```sql
   sqrt(pow(umap_x - $1, 2) + pow(umap_y - $2, 2) + pow(umap_z - $3, 2))
   ```
7. Results returned sorted by distance

## Troubleshooting

| Issue                          | Cause                           | Fix                                                  |
| ------------------------------ | ------------------------------- | ---------------------------------------------------- |
| `getaddrinfo EAI_AGAIN umap`   | UMAP not on same Docker network | Run `install-umap.yml` (POC mode fixes this)         |
| Model loading slow             | First startup                   | Wait 2-3 minutes for model to load                   |
| Out of memory                  | Insufficient RAM                | Increase VM to 16GB+ or set `--memory=4g`            |
| Connection refused from App VM | Firewall                        | Allow App VM → ML VM on port 5001                    |
| 500 error on **Spatial** search    | UMAP unreachable                | Check `docker compose logs unoverse` for UMAP errors |
| "Model may not be trained"     | No UMAP model for workflow      | Train model via Dictionary → Settings in **Canvas**      |

## Next Steps

- [04-harden.md](./04-harden.md) - Security hardening
