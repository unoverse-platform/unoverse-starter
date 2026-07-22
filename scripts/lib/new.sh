#!/usr/bin/env bash
# unoverse new — scaffold a new org (folder structure + default token set)
#   ./unoverse new org <name>

cmd_new() {
  if ! command -v node >/dev/null 2>&1; then
    echo "unoverse new requires Node.js 20+"; exit 1
  fi
  node "$GRAVITY_LIB/new.mjs" "$@"
}
