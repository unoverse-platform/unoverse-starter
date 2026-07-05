#!/usr/bin/env bash
# unoverse build + unoverse gendesign (nodegen)

cmd_build() {
  local package="$1"
  banner "Build & Restart"

  if [ -z "$package" ]; then
    echo "  Building all packages..."
    (cd "$ROOT" && npm run build)
    ok "All packages built"
  else
    echo "  Building $package..."
    (cd "$ROOT" && npm run build -w "$package")
    ok "$package built"
  fi

  echo "  Restarting services..."
  docker compose -f "$ROOT/docker-compose.yml" restart unoverse
  ok "Services restarted — changes are live"
  echo ""
}

cmd_gendesign() {
  banner "Generate Component Nodes (nodegen)"

  # nodegen turns rx/ component definitions into loadable component-node source
  # under apps/unoverse/nodes/components (UNOVERSE_OUT=nodes/components).
  # Lives in apps/unoverse/tools — present in the platform repo (authoring),
  # not in customer starters.
  if [ ! -d "$ROOT/apps/unoverse/tools/nodegen" ]; then
    fail "nodegen not found (apps/unoverse/tools is platform-only — not shipped to starters)"
    info "Customers receive pre-generated component nodes in apps/unoverse/nodes/components."
    echo ""
    return
  fi

  echo "  Generating component nodes from rx/ ..."
  (cd "$ROOT/apps/unoverse" && npm run nodegen:local) || { fail "nodegen failed"; return; }
  ok "Component nodes generated → apps/unoverse/nodes/components"

  echo "  Restarting unoverse..."
  docker compose -f "$ROOT/docker-compose.yml" restart unoverse 2>/dev/null || true
  ok "Restarted — changes are live"
  echo ""
}
