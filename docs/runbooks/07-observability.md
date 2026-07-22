---
sidebarTitle: "Observability"
title: "Runbook: Observability (Log Viewer)"
---

Install the bundled log viewer for POC/demo environments.

## Overview

A single container — **Dozzle** (port 8080) — tails and searches every
container's logs in a live web UI. It stores nothing (streams from the Docker
socket on demand), so its footprint is flat (~30 MB RAM) and there is no
datasource, database, or dashboard to maintain.

Host log growth is bounded independently by the `json-file` log rotation set on
every service in `docker-compose.yml` (10 MB × 3 files = 30 MB ceiling each).

## When to Use

| Scenario | Install? | Notes |
|----------|----------|-------|
| **POC / Demo** | ✅ Yes | Quick live view of all container logs |
| **Enterprise** | ❌ No | Customer ships logs to their own SIEM |

## Prerequisites

- [ ] Core services deployed ([01-core.md](./01-core.md))

## Steps

### 1. Start Dozzle

```bash
cd ansible
ansible-playbook -i inventory/production.yml playbooks/install-observability.yml
```

Or directly on the server:

```bash
cd /opt/gravity && docker compose --profile observability up -d dozzle
```

### 2. Access the log viewer

Open `http://<VM_IP>:8080` in your browser.

## Uninstall

```bash
ssh root@<VM_IP> "cd /opt/gravity && docker compose stop dozzle && docker compose rm -f dozzle"
```

## Enterprise Alternative

For enterprise deployments, ship container logs to the customer's system instead
of viewing them locally — point the Docker daemon's logging driver (or a sidecar
shipper) at Splunk / ELK / Datadog.
