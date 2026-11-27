#!/bin/bash
set -uo pipefail

# Railway injects $PORT. When present, serve the backoffice on that port
# (the API is a separate Railway service at trackflow-api).
# When PORT is absent (local dev), start both.
if [ -n "${PORT:-}" ]; then
  # Railway / production: serve backoffice
  NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://trackflow-api-production.up.railway.app}" \
    npm --prefix /workspace/backoffice run dev -- --hostname 0.0.0.0 --port "$PORT" &
  main_pid=$!
else
  # Local dev: start both application and backoffice
  npm --prefix /workspace/application run dev -- --hostname 0.0.0.0 --port 3000 &
  main_pid=$!
  npm --prefix /workspace/backoffice run dev -- --hostname 0.0.0.0 --port 3001 &
fi

stop_children() {
  kill "$main_pid" 2>/dev/null || true
  # Kill any remaining node processes from the workspace
  pkill -f "next dev" 2>/dev/null || true
  wait "$main_pid" 2>/dev/null || true
}
trap 'stop_children; exit 0' INT TERM

wait "$main_pid"
status=$?
stop_children
exit "$status"