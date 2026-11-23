#!/bin/bash
set -uo pipefail

npm --prefix /workspace/application run dev -- --hostname 0.0.0.0 --port 3000 &
application_pid=$!
npm --prefix /workspace/backoffice run dev -- --hostname 0.0.0.0 --port 3001 &
backoffice_pid=$!

stop_children() {
  kill "$application_pid" "$backoffice_pid" 2>/dev/null || true
  wait "$application_pid" "$backoffice_pid" 2>/dev/null || true
}
trap 'stop_children; exit 0' INT TERM

wait -n "$application_pid" "$backoffice_pid"
status=$?
stop_children
exit "$status"