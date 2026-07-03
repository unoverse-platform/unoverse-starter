# Runbook: Caddy (TLS + Reverse Proxy)

Configure Caddy for TLS termination and hostname-based routing.

## Overview

Caddy provides:

- Automatic Let's Encrypt TLS certificates
- Hostname-based routing (api.domain.com → server, mcp.domain.com → mcp-server)
- HTTP → HTTPS redirect

**Caddy is optional.** Skip this if customer has their own load balancer (F5, HAProxy, AWS ALB).

## Prerequisites

- [ ] Core services deployed ([01-core.md](./01-core.md))
- [ ] DNS A records pointing to VM IP (or Load Balancer IP)
- [ ] Ports 80 and 443 open on firewall

## When to Use Caddy

| Scenario                   | Use Caddy? | Notes                             |
| -------------------------- | ---------- | --------------------------------- |
| Single VM, no LB           | ✅ Yes     | Caddy handles TLS + routing       |
| Multi-VM with cloud LB     | ✅ Yes     | LB passthrough, Caddy handles TLS |
| Enterprise with F5/HAProxy | ❌ No      | Customer LB handles everything    |

## Steps

### 1. Configure DNS

Point these A records to your VM IP (or Load Balancer IP):

| Hostname                  | Value     |
| ------------------------- | --------- | -------------------------------------- |
| `yourdomain.com`          | `<VM_IP>` |
| `api.yourdomain.com`      | `<VM_IP>` |
| `mcp.yourdomain.com`      | `<VM_IP>` |
| `unoverse.yourdomain.com` | `<VM_IP>` |
| `umap.yourdomain.com`     | `<VM_IP>` | Only if `CADDY_INCLUDE_UMAP=true` |

> Do **not** create a `memory.yourdomain.com` record — the memory dashboard is never exposed (see below).

### 2. Install Caddy

```bash
cd ansible

# Standard (Canvas, API, MCP, Unoverse)
ansible-playbook -i inventory/production.yml playbooks/install-caddy.yml \
  -e "domain=yourdomain.com"

# With external UMAP access (required if local dev or external clients
# need to call the UMAP service via UMAP_SERVICE_URL=https://umap.yourdomain.com)
ansible-playbook -i inventory/production.yml playbooks/install-caddy.yml \
  -e "domain=yourdomain.com" -e "include_umap=true"
```

> **`gravity deploy caddy`** reads the optional `CADDY_INCLUDE_UMAP` and `CADDY_BEHIND_LB` flags from `.env.production` (both default `false`) and passes them through — it no longer hardcodes `include_umap=true`. Set `CADDY_INCLUDE_UMAP=true` there if you need the umap route.

### 3. Verify

```bash
curl https://yourdomain.com
curl https://api.yourdomain.com/health
curl https://mcp.yourdomain.com/health
curl https://unoverse.yourdomain.com/health
curl https://umap.yourdomain.com/health  # only if CADDY_INCLUDE_UMAP=true
```

## With Load Balancer (HTTPS Passthrough)

If using a cloud load balancer (DigitalOcean, AWS, etc.):

1. Configure LB for **HTTPS Passthrough** (443 → 443)
2. Point DNS to Load Balancer IP
3. Install Caddy normally (it handles TLS)

```
User → LB (HTTPS Passthrough) → VM → Caddy (TLS) → Services
```

## Configured Routes

| Subdomain             | Service      | Port | Visibility                              |
| --------------------- | ------------ | ---- | --------------------------------------- |
| `domain.com`          | Canvas (UI)  | 3001 | Public (always)                          |
| `api.domain.com`      | API Server   | 4100 | Public (always)                          |
| `mcp.domain.com`      | MCP Server   | 4103 | Public (always)                          |
| `unoverse.domain.com` | Unoverse     | 4105 | Public (always, JWT-gated in-app)        |
| `umap.domain.com`     | UMAP Service | 5001 | Public only if `CADDY_INCLUDE_UMAP=true` |

> Only Unoverse's public port (4105) is proxied. The internal node runtime (`:4106`) is Docker-network-only and is never routed through Caddy.

> **⚠️ Memory dashboard (port 4104) is NEVER exposed via Caddy.**
> It is an internal admin tool — enterprise clients access it via SSH tunnel only:
>
> ```bash
> ssh -L 4104:localhost:4104 root@<VM_IP>
> # Then open: http://localhost:4104/dashboard
> ```
>
> Do NOT add a `memory.domain.com` Caddy route. The Caddyfile template ships with no memory route (the `/mem-api/*` rewrite on the root domain remains); keep it that way.

## Expected Output

```
CADDY REVERSE PROXY INSTALLED
============================================
Host: gravity-prod (<YOUR_VM_IP>)
Domain: yourdomain.com
Mode: Direct (TLS via Lets Encrypt)

Configured routes:
  - https://yourdomain.com -> Canvas (port 3001)
  - https://api.yourdomain.com -> API Server (port 4100)
  - https://mcp.yourdomain.com -> MCP Server (port 4103)
  - https://unoverse.yourdomain.com -> Unoverse (port 4105)
  - https://umap.yourdomain.com -> UMAP Service (port 5001)  # only if CADDY_INCLUDE_UMAP=true
```

## Troubleshooting

| Issue                    | Cause                  | Fix                                        |
| ------------------------ | ---------------------- | ------------------------------------------ |
| Cert provisioning failed | DNS not pointing to VM | Verify DNS with `dig yourdomain.com`       |
| Port 80/443 blocked      | Firewall               | Open ports: `ufw allow 80,443/tcp`         |
| Too many cert requests   | Rate limited           | Wait 1 hour, Let's Encrypt has rate limits |

## Uninstall Caddy

```bash
ansible-playbook -i inventory/production.yml playbooks/uninstall-caddy.yml
```

## Next Steps

- [06-test.md](./06-test.md) - Verify connectivity
