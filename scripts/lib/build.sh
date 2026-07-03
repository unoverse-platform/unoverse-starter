#!/usr/bin/env bash
# gravity build + gravity gendesign

cmd_build() {
  local package="$1"
  banner "Build & Restart"

  if [ -z "$package" ]; then
    # No package specified — build all, gen:nodes, restart
    echo "  Building all packages..."
    (cd "$ROOT" && npm run build)
    ok "All packages built"

    echo "  Generating nodes from design system..."
    (cd "$ROOT" && npm run gen:nodes 2>/dev/null) || warn "gen:nodes skipped"
    ok "Node generation complete"
  else
    echo "  Building $package..."
    (cd "$ROOT" && npm run build -w "$package")
    ok "$package built"
  fi

  echo "  Restarting services..."
  docker compose -f "$ROOT/docker-compose.yml" restart unoverse workflow
  ok "Services restarted — changes are live"
  echo ""
}

cmd_gendesign() {
  banner "Generate Design System Nodes"

  echo "  Generating workflow nodes from design system..."
  (cd "$ROOT" && npm run gen:nodes)
  ok "Node generation complete"

  echo "  Restarting services..."
  docker compose -f "$ROOT/docker-compose.yml" restart unoverse workflow
  ok "Services restarted — changes are live"
  echo ""
}
