# Gravity Platform Ansible Automation

Ansible playbooks for deployment, upgrades, and operations.

## Structure

```
ansible/
├── inventory/
│   ├── production.yml.example  # Copy this to get started
│   └── production.yml          # Your inventory (gitignored)
├── playbooks/                  # All playbooks use hosts: all
├── files/
│   ├── .env.example            # Environment template
│   └── .env                    # Your secrets (gitignored)
├── templates/
│   └── Caddyfile.j2            # Caddy config template
└── ansible.cfg
```

## Quick Start

```bash
# 1. Configure inventory
cp inventory/production.yml.example inventory/production.yml
vim inventory/production.yml  # Set your VM IP

# 2. Configure environment
cp files/.env.example files/.env
vim files/.env  # Set DATABASE_URL, REDIS_*, AUTH_*, DOCR_TOKEN

# 3. Install
ansible-playbook -i inventory/production.yml playbooks/install.yml

# 4. Verify
ansible-playbook -i inventory/production.yml playbooks/health-check.yml
```

## Playbooks

All playbooks target `hosts: all`. For enterprise multi-VM setups, use `-l` to limit to a group.

| Playbook                | Purpose                                      |
| ----------------------- | -------------------------------------------- |
| `install.yml`           | Fresh install (Docker, images, services)     |
| `install-umap.yml`      | Install UMAP service (spatial search)        |
| `install-caddy.yml`     | Caddy reverse proxy with automatic TLS       |
| `migrate-db.yml`        | Migrate database between providers           |
| `rollback.yml`          | Rollback to previous version                 |
| `health-check.yml`      | Verify all services healthy                  |
| `db-setup.yml`          | Database setup and migrations                |
| `deploy-packages.yml`   | Deploy customer packages                     |
| `backup.yml`            | Backup UMAP models                           |
| `restore.yml`           | Restore UMAP models from backup              |
| `harden.yml`            | Security hardening (SSH, firewall, fail2ban) |
| `test-connectivity.yml` | Test VM connectivity and ports               |
| `uninstall-caddy.yml`   | Remove Caddy                                 |

## POC vs Enterprise

```bash
# POC (single VM) — just run the playbook
ansible-playbook -i inventory/production.yml playbooks/install.yml

# Enterprise (multi-VM) — use -l to target a group
ansible-playbook -i inventory/production.yml playbooks/install.yml -l app_vms
ansible-playbook -i inventory/production.yml playbooks/install-umap.yml -l ml_vms
```

## Requirements

- Ansible 2.12+
- SSH access to target VMs
- DOCR token (for pulling Docker images from DigitalOcean Container Registry)
