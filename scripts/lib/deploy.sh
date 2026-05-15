#!/usr/bin/env bash
# gravity deploy — deploy to production VM from local

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
  deploy_host=$(grep '^DEPLOY_HOST=' "$env_prod" | cut -d= -f2-)
  deploy_user=$(grep '^DEPLOY_USER=' "$env_prod" | cut -d= -f2-)

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
  tmp_inventory=$(mktemp)
  cat > "$tmp_inventory" << 'EOF'
all:
  hosts:
    gravity-prod:
      ansible_host: DEPLOY_HOST_PLACEHOLDER
      ansible_user: DEPLOY_USER_PLACEHOLDER
EOF

  # Replace placeholders with actual values
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/DEPLOY_HOST_PLACEHOLDER/$deploy_host/g" "$tmp_inventory"
    sed -i '' "s/DEPLOY_USER_PLACEHOLDER/$deploy_user/g" "$tmp_inventory"
  else
    sed -i "s/DEPLOY_HOST_PLACEHOLDER/$deploy_host/g" "$tmp_inventory"
    sed -i "s/DEPLOY_USER_PLACEHOLDER/$deploy_user/g" "$tmp_inventory"
  fi

  local ansible_dir="$ROOT/ansible"
  local subcommand="${1:-full}"

  case "$subcommand" in
    packages|pkg)
      info "Deploying packages only..."
      echo ""
      ansible-playbook \
        -i "$tmp_inventory" \
        "$ansible_dir/playbooks/deploy-packages.yml" \
        -e "env_file=$env_prod"
      ;;
    full|"")
      info "Running full deployment (install + packages)..."
      echo ""
      ansible-playbook \
        -i "$tmp_inventory" \
        "$ansible_dir/playbooks/install.yml" \
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
      info "Installing Caddy for $domain..."
      echo ""
      ansible-playbook \
        -i "$tmp_inventory" \
        "$ansible_dir/playbooks/install-caddy.yml" \
        -e "domain=$domain" \
        -e "env_file=$env_prod"
      ;;
    umap)
      info "Installing UMAP service..."
      echo ""
      ansible-playbook \
        -i "$tmp_inventory" \
        "$ansible_dir/playbooks/install-umap.yml" \
        -e "env_file=$env_prod"
      ;;
    harden)
      info "Running security hardening..."
      echo ""
      ansible-playbook \
        -i "$tmp_inventory" \
        "$ansible_dir/playbooks/harden.yml" \
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
      echo "Usage: gravity deploy [command]"
      echo ""
      echo "Commands:"
      echo "  (none)     Full deployment (install + packages)"
      echo "  packages   Deploy packages only (rsync + build)"
      echo "  db         Run database setup"
      echo "  caddy      Install Caddy TLS reverse proxy"
      echo "  umap       Install UMAP AI service"
      echo "  harden     Security hardening"
      echo "  test       Run connectivity test"
      rm -f "$tmp_inventory"
      exit 1
      ;;
  esac

  rm -f "$tmp_inventory"

  echo ""
  echo -e "  ${GREEN}${BOLD}Done${NC} ${DIM}in $(timer_elapsed)${NC}"
  echo ""
}
