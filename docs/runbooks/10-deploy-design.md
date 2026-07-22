---
sidebarTitle: "Deploy Design"
title: "Runbook: Deploy Design (rx/)"
---

The fast lane for design changes: push your `apps/unoverse/rx/` definitions (components, atoms, org templates + styles) to the server and restart. **No build step** — component nodes are definition-backed and synthesize from `rx/` at boot; restyles of existing components apply live.

Takes seconds. Use it for every design-only iteration.

## Prerequisites

- [ ] Core platform deployed ([01-core.md](./01-core.md))
- [ ] `.env.production` configured with `DEPLOY_HOST`
- [ ] `./unoverse lint` clean (authoring-time checks)

## Deploy

```bash
unoverse deploy design
```

Or manually via Ansible:

```bash
cd ansible
ansible-playbook -i inventory/production.yml playbooks/deploy-design.yml
```

This playbook:

1. Rsyncs `apps/unoverse/rx/` from your local machine to the server
2. Restarts `unoverse` — component nodes re-synthesize from the deployed definitions at boot

## When NOT to use this

| You changed | Use instead |
|---|---|
| Node package source (`apps/unoverse/nodes/*`) | [`unoverse deploy packages`](./08-deploy-packages.md) — that lane builds |
| Prompts (`apps/unoverse/prompts/*`) | `unoverse deploy packages` |
| Platform images (new release tag) | `unoverse update` on the server |

## Verify

```bash
unoverse deploy test
```

Or check the component bundles directly with `./unoverse check` on the server. A brand-new component should appear in the node catalog after the restart; a restyle of an existing component only needs a client hard-refresh.

## Expected Output

```
============================================
DESIGN DEPLOYED (rx/ definitions)
============================================
Host:    gravity-prod (x.x.x.x)
Restart: OK
============================================
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| New component not in catalog | invalid definition JSON | run `./unoverse lint` locally, fix, redeploy |
| rsync permission error | SSH key not set up | check `DEPLOY_HOST` / `DEPLOY_USER` in `.env.production` |
| Old look still renders | client caching | hard-refresh the browser |
| Component errors at runtime | universal package dist stale on server | run `unoverse deploy packages` once (it always rebuilds it) |

## Related

- [08-deploy-packages.md](./08-deploy-packages.md) — Full carve-out deploy (builds)
- [09-restart-rebuild.md](./09-restart-rebuild.md) — Local restart/rebuild decision table
