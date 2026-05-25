# Getting Started

Set up your local development environment for building on Gravity.

---

## How It Works

[`gravity-starter`](https://github.com/gravity-platform/gravity-starter) is an open-source starter kit. You **fork** it to your own GitHub account, then build your custom nodes, components, and workflows on top of the platform.

The core platform runs as Docker images — you pull pre-built binaries and build ON TOP of them.

---

## Prerequisites

Install these on your machine:

| Tool        | Version | Install                                 |
| ----------- | ------- | --------------------------------------- |
| **Docker**  | 24+     | https://docs.docker.com/get-docker/     |
| **Node.js** | 20+     | https://nodejs.org/ or `nvm install 20` |
| **Git**     | 2.x     | https://git-scm.com/                    |

> **Mac (Apple Silicon) users:** Platform images are multi-arch (amd64 + arm64) and run natively — no Rosetta or emulation needed.

---

## Step 1: Fork & Clone

1. Fork [`gravity-platform/gravity-starter`](https://github.com/gravity-platform/gravity-starter) to your own GitHub account
2. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/gravity-starter.git ~/gravity
cd ~/gravity
```

3. Add the upstream remote so you can pull future platform updates:

```bash
git remote add upstream https://github.com/gravity-platform/gravity-starter.git
```

---

## Step 2: Get Your Credentials

When you sign up for Gravity, you'll receive:

1. **DOCR Token** — for pulling Docker images (DigitalOcean Container Registry)
2. **DATABASE_URL** — PostgreSQL connection string
3. **Redis credentials** — host, port, password
4. **Auth credentials** — AUTH_ISSUER, AUTH_CLIENT_ID, AUTH_AUDIENCE

---

## Step 3: Run the Setup Wizard

The Gravity CLI handles everything — Docker login, environment config, and image pulling:

```bash
cd ~/gravity
./gravity init
```

> **Note:** Use `./gravity` (with `./`) the first time — the CLI isn't on your PATH yet. After init completes, it installs itself to your PATH so you can use `gravity` directly.

The wizard will ask for your DOCR token, database URL, Redis, and auth credentials. It generates your `.env` file, logs into the registry, and pulls all platform images.

### Understanding the Two `.env` Files

Your project has **two** `.env` files, both at the project root:

| File                  | Purpose                   | Used By                                       |
| --------------------- | ------------------------- | --------------------------------------------- |
| **`.env`**            | **Local development**     | `docker compose` on your machine              |
| **`.env.production`** | **Production deployment** | `gravity deploy` copies to server             |

- `.env` points to **local** services (Redis on `localhost`, no TLS, no `DOMAIN`)
- `.env.production` points to **production** services (managed Redis with TLS, `DOMAIN` set) and includes `DEPLOY_HOST`/`DEPLOY_USER` for targeting your VM
- Both files are **gitignored** — they contain secrets and are never committed
- Use `.env.example` and `.env.production.example` as templates

> **Do not mix them up.** `.env` is for your laptop. `.env.production` is for the server.

---

## Step 4: Start the Dev Environment

```bash
gravity dev
```

This single command does everything:

1. **Starts the platform** (all Docker containers)
2. **Installs workspace dependencies** (`npm install`)
3. **Generates workflow nodes** from the design system (`gen:nodes`)

---

## Step 5: Set Up the Database

> **The platform must be running first.** The migration code is bundled inside the workflow Docker image, so `gravity db-setup` executes inside that container.

Runs all pending migrations and seeds the database. Safe to re-run — migrations are tracked and only applied once:

```bash
gravity db-setup
```

---

## Step 6: Verify

```bash
gravity check
```

All checks should pass:

```
  Gravity Platform Health Check

  ✓ server
  ✓ workflow
  ✓ node-service
  ✓ canvas
  ✓ umap
  ✓ mcp-server

  ✓ server health :4100
  ✓ workflow health :4101
  ✓ node-service health :4102
  ✓ umap health :5001

  ✓ 12/12 packages built
  ✓ 12 plugins loaded
  ✓ Component bundles served
  ✓ Canvas http://localhost:3001

  All 14 checks passed
```

---

## Step 7: Access Services

| Service    | URL                   | Description      |
| ---------- | --------------------- | ---------------- |
| **Canvas** | http://localhost:3001 | Workflow Builder |
| **API**    | http://localhost:4100 | REST API         |

---

## Developing Your Code

### Custom Nodes

```bash
# Edit your node code in packages/my-custom-node/
gravity build @gravity-platform/my-custom-node
```

### UI Components (Design System)

```bash
# Edit components in apps/design-system/storybook/
# Then regenerate and restart:
gravity gendesign
```

### Storybook (Component Preview)

```bash
npm run storybook -w @gravity-platform/design-system-dev
# Opens http://localhost:6006
```

---

## Daily Workflow

```bash
# Start your day
cd ~/gravity
gravity dev

# Make changes to packages/ or apps/design-system/
gravity build               # Build all + gen:nodes + restart
gravity build @gravity-platform/my-node  # Or build one package

# End your day
gravity stop
```

---

## Updating the Platform

When a new platform version is released:

```bash
cd ~/gravity
git fetch upstream
git merge upstream/main  # Pull latest starter code from upstream
gravity update           # Pull latest images and restart
```

---

## Platform Commands

| Command                | Purpose                                             |
| ---------------------- | --------------------------------------------------- |
| `gravity init`         | Interactive setup wizard (first time)               |
| `gravity db-setup`     | Run database migrations + seed (safe to re-run)     |
| `gravity start`        | Start the platform                                  |
| `gravity stop`         | Stop the platform                                   |
| `gravity status`       | Show service health                                 |
| `gravity logs`         | Stream logs                                         |
| `gravity update`       | Pull latest images and restart                      |
| `gravity update nodes` | Rebuild packages and restart node-service           |
| `gravity check`        | Run full health check                               |
| `gravity doctor`       | Diagnose issues                                     |
| `gravity dev`          | Install deps, generate nodes, start dev environment |
| `gravity build`        | Build all packages + gen:nodes + restart services   |
| `gravity build <pkg>`  | Build one package + restart services                |
| `gravity gendesign`    | Generate design system nodes + restart              |
| `gravity open`         | Open Canvas in browser (`gravity open grafana`)     |
| `gravity help`         | Show all commands                                   |

---

## Troubleshooting

Run the doctor to diagnose issues:

```bash
cd ~/gravity
gravity doctor
```

### "unauthorized" when pulling images

```bash
# Re-login to DOCR with your token
echo "dop_v1_xxxxx" | docker login registry.digitalocean.com -u dop_v1_xxxxx --password-stdin
```

### Services not starting

```bash
gravity logs server    # Check specific service logs
gravity logs workflow
```

### Can't reach database server at 127.0.0.1

If you're using a **local Postgres** instance and see `Can't reach database server at 127.0.0.1:5432`, this is because `localhost` inside a Docker container refers to the container itself — not your host machine.

Use `host.docker.internal` instead of `localhost` in your `DATABASE_URL`:

```bash
# ❌ Won't work from inside Docker
DATABASE_URL=postgresql://postgres:password@localhost:5432/gravity

# ✅ Correct for local Postgres
DATABASE_URL=postgresql://postgres:password@host.docker.internal:5432/gravity
```

> `host.docker.internal` is Docker Desktop's built-in DNS name that resolves to your Mac/Windows host. It is not needed when using a remote managed database (DigitalOcean, Supabase, etc.).

### `extension "vector" is not available` during db-setup

The `pgvector` extension must be installed in your local Postgres before running `gravity db-setup`. It is pre-installed on managed databases (DigitalOcean Postgres, Supabase) but not on a standard local Postgres.

**Homebrew (Mac):**

```bash
brew install pgvector
```

**Ubuntu/Debian:**

```bash
sudo apt install postgresql-16-pgvector   # replace 16 with your PG version
```

**Docker Postgres image:** Use the `pgvector/pgvector` image instead of plain `postgres`:

```yaml
image: pgvector/pgvector:pg16 # pg15, pg16, or pg17
```

After installing, restart Postgres and re-run `gravity db-setup`.

### Redis connection refused

For local development, start Redis with Docker:

```bash
docker run -d --name gravity-redis -p 6379:6379 redis:7-alpine
```

### Clean restart

```bash
gravity stop
gravity start
```

### Nuclear reset (deletes all data!)

```bash
docker compose down -v
docker system prune -a -f
gravity start
```

---

## What's Next?

- [Challenge 2: Create Your First Agent](./02-create-your-first-agent.md)
- [Challenge 3: Create Your First Node](./03-create-your-first-node.md)
