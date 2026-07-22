---
sidebarTitle: "Deploy Packages"
title: "Runbook: Deploy Packages"
---

Deploy the developer carve-out (custom nodes, rx design definitions, prompts) to the server.

## Prerequisites

- [ ] Core platform deployed ([01-core.md](./01-core.md))
- [ ] `.env.production` configured with `DEPLOY_HOST`
- [ ] Changes built locally (packages have `dist/`)

## Deploy

```bash
unoverse deploy packages
```

Or manually via Ansible:

```bash
cd ansible
ansible-playbook -i inventory/production.yml playbooks/deploy-packages.yml
```

This playbook:

1. Rsyncs the three developer-editable folders (`apps/unoverse/{nodes,rx,prompts}`) from your local machine to the server
2. Runs `npm install` + `turbo build` on the server
3. Restarts `unoverse` to load the built packages (compose mounts `./packages` into the container at `/app/host_packages`; `PACKAGES_PATH=/app/host_packages`)

## Verify

```bash
unoverse deploy test
```

Check the **Plugins & Packages** section — `nodes` should be > 0.

## Expected Output

```
PACKAGES DEPLOYED
============================================
Mode:    rsync (local)
Build:   OK
Restart: OK
============================================
```

## Troubleshooting

| Issue                  | Cause                 | Fix                                                    |
| ---------------------- | --------------------- | ------------------------------------------------------ |
| nodes=0 on server      | Packages not built    | Re-run `unoverse deploy packages`                       |
| Build FAILED           | Missing dependency    | SSH in, run `cd /opt/gravity && npm install` manually  |
| rsync permission error | SSH key not set up    | Check `DEPLOY_HOST` and `DEPLOY_USER` in `.env.production` |
| unoverse unhealthy     | Bad package code      | Check `docker compose logs unoverse` on server         |

## Related

- [01-core.md](./01-core.md) — Initial deployment
- [06-test.md](./06-test.md) — Full health check
