# Getting Started

Set up your local development environment for building on Unoverse.

---

## How It Works

[`unoverse-starter`](https://github.com/unoverse-platform/unoverse-starter) is an open-source starter kit. You **fork** it to your own GitHub account, then build your custom nodes, components, and workflows on top of the platform.

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

1. Fork [`unoverse-platform/unoverse-starter`](https://github.com/unoverse-platform/unoverse-starter) to your own GitHub account
2. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/unoverse-starter.git ~/unoverse
cd ~/unoverse
```

3. Add the upstream remote so you can pull future platform updates:

```bash
git remote add upstream https://github.com/unoverse-platform/unoverse-starter.git
```

---

## Step 2: Get Your Credentials

When you sign up for Unoverse, you'll receive:

1. **DOCR Token** — for pulling Docker images (DigitalOcean Container Registry)
2. **DATABASE_URL** — PostgreSQL connection string
3. **Redis credentials** — host, port, password
4. **Auth credentials** — AUTH_ISSUER, AUTH_CLIENT_ID, AUTH_AUDIENCE

---

## Step 3: Run the Setup Wizard

The `unoverse` CLI handles everything — Docker login, environment config, and image pulling:

```bash
cd ~/unoverse
./unoverse init
```

> **Note:** Use `./unoverse` (with `./`) the first time — the CLI isn't on your PATH yet. After init completes, it installs itself to your PATH so you can use `unoverse` directly.

The wizard will ask for your DOCR token, database URL, Redis, and auth credentials. It generates your `.env` file, logs into the registry, and pulls all platform images.

### Understanding the Two `.env` Files

Your project has **two** `.env` files, both at the project root:

| File                  | Purpose                   | Used By                                       |
| --------------------- | ------------------------- | --------------------------------------------- |
| **`.env`**            | **Local development**     | `docker compose` on your machine              |
| **`.env.production`** | **Production deployment** | `unoverse deploy` copies to server             |

- `.env` points to **local** services (Redis on `localhost`, no TLS, no `DOMAIN`)
- `.env.production` points to **production** services (managed Redis with TLS, `DOMAIN` set) and includes `DEPLOY_HOST`/`DEPLOY_USER` for targeting your VM
- Both files are **gitignored** — they contain secrets and are never committed
- Use `.env.example` and `.env.production.example` as templates

> **Do not mix them up.** `.env` is for your laptop. `.env.production` is for the server.

---

## Step 4: Start the Dev Environment

```bash
unoverse dev
```

This single command does everything:

1. **Starts the platform** (all Docker containers, if not already running)
2. **Installs workspace dependencies** (`npm install`)
3. **Builds all node packages** and restarts unoverse so they load

---

## Step 5: Set Up the Database

> **The platform must be running first.** The migration code is bundled inside the unoverse Docker image (the platform runtime), so `unoverse db-setup` executes inside that container.

Runs all pending migrations and seeds the database. Safe to re-run — migrations are tracked and only applied once:

```bash
unoverse db-setup
```

---

## Step 6: Verify

```bash
unoverse check
```

All checks should pass:

```
  Unoverse Platform Health Check

  ✓ unoverse
  ✓ canvas
  ✓ umap
  ✓ mcp-server
  ✓ memory

  ✓ unoverse health :4105
  ✓ engine health :4101
  ✓ umap health :5001

  ✓ 12/12 packages built
  ✓ 97 nodes loaded
  ✓ Component bundles served
  ✓ Canvas http://localhost:3001

  All checks passed
```

---

## Step 7: Access Services

| Service    | URL                   | Description      |
| ---------- | --------------------- | ---------------- |
| **Canvas** | http://localhost:3001 | Workflow Builder |
| **API**    | http://localhost:4105 | REST API (unoverse public listener) |
| **Studio** | http://localhost:4105 | Unoverse Studio — preview and test components, templates, skills, and nodes |

> **Studio:** enable it by setting `UNOVERSE_WORKBENCH=1` on the `unoverse` service in
> `docker-compose.yml`, then restart (`docker compose up -d unoverse`).

---

## Where Your Code Lives

Three developer-editable folders are mounted into the running platform — everything
you build goes in one of them:

| Folder | What you edit | Tutorial |
|--------|---------------|----------|
| `apps/unoverse/nodes/`   | **Logic** — custom workflow node packages | [Challenge 3](./03-create-your-first-node.md) |
| `apps/unoverse/rx/`      | **Design** — components, templates, styles (JSON definitions) | [Challenge 5](./05-components-and-templates.md) |
| `apps/unoverse/prompts/` | **Behavior** — agent skills + prompt blocks | [Challenge 2](./02-create-your-first-agent.md) |

---

## Daily Workflow

```bash
# Start your day
cd ~/unoverse
unoverse dev

# Edit apps/unoverse/nodes (logic), apps/unoverse/rx (design), or apps/unoverse/prompts (behavior)
unoverse build               # Build all + restart
unoverse build @unoverse-platform/my-node  # Or build one node package

# End your day
unoverse stop
```

---

## Updating the Platform

When a new platform version is released:

```bash
cd ~/unoverse
git fetch upstream
git merge upstream/main  # Pull latest starter code from upstream
unoverse update           # Pull latest images and restart
```

---

## Platform Commands

| Command                | Purpose                                             |
| ---------------------- | --------------------------------------------------- |
| `unoverse init`         | Interactive setup wizard (first time)               |
| `unoverse db-setup`     | Run database migrations + seed (safe to re-run)     |
| `unoverse start`        | Start the platform                                  |
| `unoverse stop`         | Stop the platform                                   |
| `unoverse status`       | Show service health                                 |
| `unoverse logs`         | Stream logs                                         |
| `unoverse update`       | Pull latest images and restart                      |
| `unoverse update nodes` | Rebuild packages and restart unoverse               |
| `unoverse check`        | Run full health check                               |
| `unoverse doctor`       | Diagnose issues                                     |
| `unoverse dev`          | Start platform if needed, install deps, build packages, restart |
| `unoverse build`        | Build all node packages + restart services          |
| `unoverse build <pkg>`  | Build one package + restart services                |
| `unoverse gendesign`    | Regenerate component nodes from `rx/` + restart     |
| `unoverse open`         | Open in browser (`unoverse open canvas\|api\|logs`)  |
| `unoverse help`         | Show all commands                                   |

---

## Troubleshooting

Run the doctor to diagnose issues:

```bash
cd ~/unoverse
unoverse doctor
```

### "unauthorized" when pulling images

```bash
# Re-login to DOCR with your token
echo "dop_v1_xxxxx" | docker login registry.digitalocean.com -u dop_v1_xxxxx --password-stdin
```

### Services not starting

```bash
unoverse logs unoverse    # Check specific service logs
unoverse logs canvas
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

The `pgvector` extension must be installed in your local Postgres before running `unoverse db-setup`. It is pre-installed on managed databases (DigitalOcean Postgres, Supabase) but not on a standard local Postgres.

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

After installing, restart Postgres and re-run `unoverse db-setup`.

### Redis connection refused

For local development, start Redis with Docker:

```bash
docker run -d --name unoverse-redis -p 6379:6379 redis:7-alpine
```

### Clean restart

```bash
unoverse stop
unoverse start
```

### Nuclear reset (deletes all data!)

```bash
docker compose down -v
docker system prune -a -f
unoverse start
```

---

## What's Next?

- [Challenge 2: Create Your First Agent](./02-create-your-first-agent.md)
- [Challenge 3: Create Your First Node](./03-create-your-first-node.md)
