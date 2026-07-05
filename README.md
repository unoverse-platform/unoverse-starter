# Unoverse Starter Template

Build custom AI experiences powered by the Unoverse platform.

## Quick Start

```bash
# 1. Setup (configure env, login to registry, pull images)
./unoverse init

# 2. Start the platform
./unoverse start

# 3. Install dev dependencies (for building custom nodes & components)
npm install
```

## Platform Commands

| Command | Purpose |
|---------|---------|
| `unoverse init` | Interactive setup wizard |
| `unoverse start` | Start the platform |
| `unoverse stop` | Stop the platform |
| `unoverse status` | Show service health |
| `unoverse logs` | Stream logs (`unoverse logs unoverse` for one service) |
| `unoverse update` | Pull latest images and restart |
| `unoverse doctor` | Diagnose issues |
| `unoverse dev` | Install deps, start dev environment |
| `unoverse build` | Build all + restart (`unoverse build <pkg>` for one) |

## Access

- **Canvas** (Workflow Builder): http://localhost:3001
- **API**: http://localhost:4105

### Optional

- **Studio** (Unoverse Studio — components, templates, skills, nodes): http://localhost:4105
  — enable by setting `UNOVERSE_WORKBENCH=1` on the `unoverse` service in `docker-compose.yml`
- **Analytics & logs** (Dozzle — live container logs, stores nothing): http://localhost:8080
  — start with `docker compose --profile observability up -d dozzle`

## Development

### Custom Nodes

```bash
# Create a new package in packages/my-custom-node/
# ... write your node code ...

# Build and restart
./unoverse build @gravity-platform/my-custom-node
```

See `docs/nodes/` for full node development guide.

## Deployment (Production)

See `ansible/` and `docs/runbooks/` for production deployment.
