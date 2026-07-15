#!/usr/bin/env bash
# unoverse deploy — deploy to production VM from local

cmd_deploy() {
  local env_prod="$ROOT/.env.production"

  if [ ! -f "$env_prod" ]; then
    fail ".env.production not found"
    echo ""
    info "Create it from the template:"
    info "  cp .env.production.example .env.production"
    info "  # Fill in DEPLOY_HOST, DEPLOY_USER, and production values"
    echo ""
    exit 1
  fi

  # Read deploy target from .env.production
  local deploy_host deploy_user
  deploy_host=$(grep '^DEPLOY_HOST=' "$env_prod" | cut -d= -f2- | tr -d '\r\n' | xargs)
  deploy_user=$(grep '^DEPLOY_USER=' "$env_prod" | cut -d= -f2- | tr -d '\r\n' | xargs)

  if [ -z "$deploy_host" ] || [ "$deploy_host" = "your-vm-ip" ]; then
    fail "DEPLOY_HOST is not set in .env.production"
    exit 1
  fi
  deploy_user="${deploy_user:-root}"

  banner "Deploying to $deploy_host"
  echo ""
  timer_start

  # Check ansible is installed
  if ! command -v ansible-playbook &>/dev/null; then
    fail "Ansible is not installed"
    info "Install: pip install ansible"
    exit 1
  fi
  ok "Ansible available"

  # Generate a temporary inventory from .env.production
  local tmp_inventory
  tmp_inventory=$(mktemp).yml
  cat > "$tmp_inventory" << 'EOF'
all:
  hosts:
    gravity-prod:
      ansible_host: DEPLOY_HOST_PLACEHOLDER
      ansible_user: DEPLOY_USER_PLACEHOLDER
      ansible_python_interpreter: /usr/bin/python3
EOF

  # Replace placeholders with actual values
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/DEPLOY_HOST_PLACEHOLDER/$deploy_host/g" "$tmp_inventory"
    sed -i '' "s/DEPLOY_USER_PLACEHOLDER/$deploy_user/g" "$tmp_inventory"
  else
    sed -i "s/DEPLOY_HOST_PLACEHOLDER/$deploy_host/g" "$tmp_inventory"
    sed -i "s/DEPLOY_USER_PLACEHOLDER/$deploy_user/g" "$tmp_inventory"
  fi

  # Debug: show what's in the inventory
  echo ""
  info "Generated inventory file:"
  cat "$tmp_inventory" | sed 's/^/  /'
  echo ""

  local ansible_dir="$ROOT/ansible"
  local subcommand="${1:-full}"

  case "$subcommand" in
    packages|pkg)
      # Carve-out (nodes/rx/prompts): rsync + build (including the universal
      # component-node package, in-container) + restart. Component nodes are
      # definition-backed — they synthesize from the deployed rx/ at boot.
      # (The component build needs plugin-base in the plugins volume; if it's
      # missing it says so — run a full `deploy` or `deploy marketplace` first.)
      info "Deploying packages (carve-out)..."
      echo ""
      ansible-playbook \
        -i "$tmp_inventory" \
        "$ansible_dir/playbooks/deploy-packages.yml" \
        -e "env_file=$env_prod"
      ;;
    design|rx)
      # Design fast lane: rsync rx/ only + restart. No build — definitions
      # synthesize into component nodes at boot; restyles apply live.
      info "Deploying design (rx/ definitions)..."
      echo ""
      ansible-playbook \
        -i "$tmp_inventory" \
        "$ansible_dir/playbooks/deploy-design.yml"
      ;;
    full|"")
      # One command deploys EVERYTHING, in dependency order:
      #   install        → base host + services
      #   marketplace    → reconcile npm nodes from the DB (also installs plugin-base,
      #                    which the component-node package build needs to compile)
      #   deploy-packages→ rsync the carve-out (nodes, rx, prompts) + build (incl. the
      #                    universal component-node package) + restart (nodes synthesize
      #                    from the deployed rx/ at boot)
      info "Running full deployment (install + marketplace + packages)..."
      echo ""
      ansible-playbook \
        -i "$tmp_inventory" \
        "$ansible_dir/playbooks/install.yml" \
        -e "env_file=$env_prod"

      echo ""
      ansible-playbook \
        -i "$tmp_inventory" \
        "$ansible_dir/playbooks/install-marketplace.yml" \
        -e "env_file=$env_prod"

      echo ""
      ansible-playbook \
        -i "$tmp_inventory" \
        "$ansible_dir/playbooks/deploy-packages.yml" \
        -e "env_file=$env_prod"
      ;;
    db)
      info "Running database setup..."
      echo ""
      ansible-playbook \
        -i "$tmp_inventory" \
        "$ansible_dir/playbooks/db-setup.yml" \
        -e "env_file=$env_prod"
      ;;
    caddy)
      local domain
      domain=$(grep '^DOMAIN=' "$env_prod" | cut -d= -f2-)
      if [ -z "$domain" ] || [ "$domain" = "yourdomain.com" ]; then
        fail "DOMAIN is not set in .env.production"
        exit 1
      fi
      # Optional flags from .env.production (both default off):
      #   CADDY_INCLUDE_UMAP=true → expose umap.<domain> (POC only)
      #   CADDY_BEHIND_LB=true    → plain :80, the customer LB terminates TLS
      local include_umap behind_lb
      include_umap=$(grep '^CADDY_INCLUDE_UMAP=' "$env_prod" | cut -d= -f2- | tr -d '\r\n' | xargs)
      behind_lb=$(grep '^CADDY_BEHIND_LB=' "$env_prod" | cut -d= -f2- | tr -d '\r\n' | xargs)
      info "Installing Caddy for $domain..."
      echo ""
      ansible-playbook \
        -i "$tmp_inventory" \
        "$ansible_dir/playbooks/install-caddy.yml" \
        -e "domain=$domain" \
        -e "include_umap=${include_umap:-false}" \
        -e "behind_lb=${behind_lb:-false}" \
        -e "env_file=$env_prod"
      ;;
    caddy-uninstall|uninstall-caddy)
      info "Uninstalling Caddy (reverts to direct host ports)..."
      echo ""
      ansible-playbook \
        -i "$tmp_inventory" \
        "$ansible_dir/playbooks/uninstall-caddy.yml"
      ;;
    umap)
      info "Installing UMAP service..."
      echo ""
      ansible-playbook \
        -i "$tmp_inventory" \
        "$ansible_dir/playbooks/install-umap.yml" \
        -e "env_file=$env_prod"
      ;;
    marketplace|nodes)
      # Reconcile prod's marketplace nodes against the DB. The DB (installed_plugins) is
      # the source of truth — a Studio Install records the node there; prod has no Studio,
      # so this tells prod to install anything recorded but missing from disk. No package
      # list anywhere: the DB is the only declaration.
      info "Reconciling marketplace nodes against the database..."
      echo ""
      ansible-playbook \
        -i "$tmp_inventory" \
        "$ansible_dir/playbooks/install-marketplace.yml" \
        -e "env_file=$env_prod"
      ;;
    test|check)
      info "Running connectivity test..."
      echo ""
      ansible-playbook \
        -i "$tmp_inventory" \
        "$ansible_dir/playbooks/test-connectivity.yml" \
        -e "env_file=$env_prod"
      ;;
    *)
      echo "Usage: unoverse deploy [command]"
      echo ""
      echo "Commands:"
      echo "  (none)       Full deploy: install + marketplace + carve-out"
      echo "  packages     Deploy carve-out (nodes/rx/prompts): rsync + build + restart"
      echo "  design       Deploy rx/ design definitions only: rsync + restart (no build)"
      echo "  marketplace  Reconcile prod's marketplace nodes against the DB"
      echo "  db           Run database setup"
      echo "  caddy        Install Caddy TLS reverse proxy"
      echo "  caddy-uninstall  Remove Caddy (revert to direct host ports)"
      echo "  umap         Install UMAP AI service"
      echo "  test         Run connectivity test"
      rm -f "$tmp_inventory"
      exit 1
      ;;
  esac

  rm -f "$tmp_inventory"

  echo ""
  echo -e "  ${GREEN}${BOLD}Done${NC} ${DIM}in $(timer_elapsed)${NC}"
  echo ""
}
