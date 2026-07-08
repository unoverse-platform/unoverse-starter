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
  # under apps/unoverse/nodes/components. It runs INSIDE the unoverse container:
  # the image carries the generator (apps/unoverse/tools), its server-side deps,
  # and tsx — none of which ship as host source. The carve-out folders are mounted,
  # so it reads the local rx/ and writes nodes/components straight back to the host.
  local ns_status
  ns_status=$(docker compose -f "$ROOT/docker-compose.yml" ps --format '{{.Status}}' unoverse 2>/dev/null | head -1)
  if ! echo "$ns_status" | grep -qi "up"; then
    fail "unoverse is not running (status: ${ns_status:-unknown}) — start it first: ${BOLD}unoverse start${NC}"
    echo ""
    return
  fi

  echo "  Generating component nodes from rx/ (in the unoverse container)..."
  # -w: the container WORKDIR is /app (monorepo root); nodegen:local lives in
  # apps/unoverse/package.json, and its relative paths (tools/nodegen, nodes/components)
  # only resolve — and write back to the mounted host folders — from that directory.
  if docker compose -f "$ROOT/docker-compose.yml" exec -T -w /app/apps/unoverse unoverse npm run nodegen:local; then
    ok "Component nodes generated → apps/unoverse/nodes/components"
  else
    fail "nodegen failed — check the output above"
    return
  fi

  # nodegen emits TypeScript SOURCE; the runtime imports the compiled dist/. The
  # generated package is NOT a workspace (root globs are apps/* + plugin-base), so
  # neither `npm run build -w` nor `turbo run build` compiles it — its own `tsc` must
  # run in its own dir. Build in-container (deps resolve up to /app/node_modules); the
  # dist/ lands in the mounted host folder and rides to prod via the nodes/ rsync.
  echo "  Building component nodes (tsc → dist)..."
  if docker compose -f "$ROOT/docker-compose.yml" exec -T -w /app/apps/unoverse/nodes/components unoverse npm run build; then
    ok "Component nodes built → apps/unoverse/nodes/components/dist"
  else
    fail "component build (tsc) failed — check the output above"
    return
  fi

  echo "  Restarting unoverse..."
  docker compose -f "$ROOT/docker-compose.yml" restart unoverse 2>/dev/null || true
  ok "Restarted — changes are live"
  echo ""
}
