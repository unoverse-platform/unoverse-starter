#!/usr/bin/env bash
# unoverse build + the internal component-node package build (definition-backed)

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

# Internal helper (called by start/dev — not a user-facing command): builds the
# universal component-node package in-container and restarts unoverse. Design
# DEFINITION changes never need this — they synthesize from rx/ at boot; a plain
# restart suffices. This exists for the PACKAGE-source / stale-dist case.
build_component_nodes() {
  banner "Component Nodes (definition-backed)"

  # Component nodes are DEFINITION-BACKED: one universal executor serves every
  # component, and node definitions are synthesized from rx/components/* at boot.
  # There is NO generation step — adding or editing a component definition only
  # needs a restart. The one-time build below compiles the small hand-written
  # package (apps/unoverse/nodes/components) if its dist/ is missing.
  local ns_status
  ns_status=$(docker compose -f "$ROOT/docker-compose.yml" ps --format '{{.Status}}' unoverse 2>/dev/null | head -1)
  if ! echo "$ns_status" | grep -qi "up"; then
    fail "unoverse is not running (status: ${ns_status:-unknown}) — start it first: ${BOLD}unoverse start${NC}"
    echo ""
    return
  fi

  # The package is NOT a workspace (root globs are apps/* + plugin-base), so its
  # own tsc must run in its own dir. ALWAYS build: an update can ship new package
  # SOURCE while an old dist survives (rsync excludes dist) — skip-if-present would
  # silently run stale executor code. The build is a small tsc (seconds); component
  # DEFINITION changes alone still need no build — they synthesize from rx/ at boot.
  if true; then
    echo "  Building the universal component-node package (tsc → dist)..."
    if docker compose -f "$ROOT/docker-compose.yml" exec -T unoverse sh -c '
      if [ ! -d /app/plugins/node_modules/@unoverse-platform/plugin-base ]; then
        echo "  ✗ @unoverse-platform/plugin-base not installed in the plugins volume"; exit 1
      fi
      mkdir -p /app/node_modules/@unoverse-platform
      ln -sfn /app/plugins/node_modules/@unoverse-platform/plugin-base /app/node_modules/@unoverse-platform/plugin-base
      cd /app/apps/unoverse/nodes/components && npm run build
    '; then
      ok "Component-node package built → apps/unoverse/nodes/components/dist"
    else
      fail "component package build (tsc) failed — check the output above"
      return
    fi
  fi

  echo "  Restarting unoverse (definitions re-synthesize from rx/components)..."
  docker compose -f "$ROOT/docker-compose.yml" restart unoverse 2>/dev/null || true
  ok "Restarted — component changes are live"
  echo ""
}
