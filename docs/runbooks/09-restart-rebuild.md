# Runbook: Restart & Rebuild

Rebuild packages and restart services so the platform picks up your latest changes. Component nodes are definition-backed — they re-synthesize from `rx/` at boot, no generation step.

## When To Use

- New or updated **rx definitions** (components, atoms, templates, styles in `apps/unoverse/rx/`)
- New or updated **custom node packages** (in `apps/unoverse/nodes/`)
- New or updated **prompts** (agent skills / prompt blocks in `apps/unoverse/prompts/`)
- After `git pull` or `unoverse update` when the platform isn't reflecting changes

## Quick Commands

### Local Development

```bash
# Full rebuild — builds all node packages, restarts services
./unoverse build

# Build one package only
./unoverse build @unoverse-platform/my-package

# Restart — component nodes re-synthesize from rx/ definitions (no codegen)
./unoverse gendesign

# Full dev setup — install deps, build, restart
./unoverse dev
```

### Production Server (via Ansible)

```bash
cd ansible
ansible-playbook -i inventory/production.yml playbooks/deploy-packages.yml
```

## What Each Step Does

| Step | Command | What happens |
|------|---------|-------------|
| **1. Install deps** | `npm install` | Installs workspace dependencies |
| **2. Build packages** | `npm run build` | Compiles node packages (TypeScript → `dist/`) |
| **3. Generate component nodes** | `./unoverse gendesign` | Runs the generator **inside the unoverse container**: reads your mounted `rx/` definitions, writes loadable component nodes to `apps/unoverse/nodes/components`, restarts |
| **4. Restart unoverse** | `docker compose restart unoverse` | Reloads built packages and node definitions into the engine — the node catalog is loaded **at boot**, so a rebuild without a restart appears to do nothing |

## Which change needs which step?

| You changed | Do |
|---|---|
| A node package (`apps/unoverse/nodes/<pkg>/`) | `./unoverse build @unoverse-platform/<pkg>` |
| An **existing** component/template's look (`rx/`) | nothing — definitions are read live; hard-refresh the client |
| A **new** component, or props/structure changes (`rx/`) | `./unoverse gendesign` |
| A skill or prompt block (`prompts/`) | `docker compose restart unoverse` |

## Manual Step-by-Step (when CLI commands aren't enough)

```bash
# 1. Install dependencies
npm install

# 2. Build all node packages
npm run build

# 3. Restart so component nodes re-synthesize from rx/ (requires unoverse running)
./unoverse gendesign

# 4. Restart the service that loads packages (the workflow engine runs
#    in-process in unoverse, so one restart covers everything)
docker compose restart unoverse

# 5. Verify
./unoverse status
```

## Nuclear Restart (full teardown + rebuild)

When things are truly stuck:

```bash
./unoverse stop
npm install
npm run build
./unoverse start
./unoverse gendesign
```

## Verify

```bash
# Check all services are running
./unoverse status

# Full health check
./unoverse check

# Check nodes loaded in unoverse (:4106 is Docker-internal and :4105 /plugins
# is JWT-gated, so count from inside the container)
docker compose exec -T unoverse node -e \
  "fetch('http://127.0.0.1:4106/nodes').then(r=>r.json()).then(d=>console.log((d.nodes||[]).length)).catch(()=>console.log(0))"
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| New component not in Canvas | component node not generated | `./unoverse gendesign` |
| Node shows in Canvas but errors | Package not built | `./unoverse build` |
| Component renders old version | Client caching | hard-refresh the browser |
| `nodes: 0` in status | unoverse didn't load packages | Check `docker compose logs unoverse` |
| Build fails | Dependencies missing | `npm install`, then `./unoverse build` |
| gendesign fails | unoverse not running (the generator runs inside the container) | `./unoverse start` first |

## Related

- [01-core.md](./01-core.md) — Initial deployment
- [08-deploy-packages.md](./08-deploy-packages.md) — Deploy packages to production
- [06-test.md](./06-test.md) — Full health check
