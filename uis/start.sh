#!/bin/bash
set -uo pipefail

# Railway injects $PORT, use it for the application server
APP_PORT="${PORT:-3000}"
BACKOFFICE_PORT=3001

npm --prefix /workspace/application run dev -- --hostname 0.0.0.0 --port "$APP_PORT" &
application_pid=$!

# Start backoffice only on non-Railway environments (when PORT is not set)
if [ -z "${PORT:-}" ]; then
  npm --prefix /workspace/backoffice run dev -- --hostname 0.0.0.0 --port "$BACKOFFICE_PORT" &
  backoffice_pid=$!
else
  backoffice_pid=""
fi

stop_children() {
  kill "$application_pid" ${backoffice_pid:+"$backoffice_pid"} 2>/dev/null || true
  wait "$application_pid" ${backoffice_pid:+"$backoffice_pid"} 2>/dev/null || true
}
trap 'stop_children; exit 0' INT TERM

if [ -n "$backoffice_pid" ]; then
  wait -n "$application_pid" "$backoffice_pid"
else
  wait "$application_pid"
fi
status=$?
stop_children
exit "$status"