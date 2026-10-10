#!/usr/bin/env bash
set -euo pipefail

port="${SMOKE_PORT:-3100}"
log_file="$(mktemp /tmp/masterme-next-smoke.XXXXXX.log)"
server_pid=''

cleanup() {
  if [[ -n "$server_pid" ]]; then kill "$server_pid" >/dev/null 2>&1 || true; fi
  rm -f "$log_file"
}
trap cleanup EXIT

bun run start -- --hostname 127.0.0.1 --port "$port" >"$log_file" 2>&1 &
server_pid="$!"

for attempt in $(seq 1 30); do
  if headers="$(curl --fail --silent --show-error --max-time 2 --dump-header - --output /dev/null "http://127.0.0.1:${port}/")"; then
    grep --ignore-case --quiet '^x-content-type-options: nosniff' <<<"$headers"
    grep --ignore-case --quiet '^content-security-policy:' <<<"$headers"
    curl --fail --silent --show-error --max-time 2 "http://127.0.0.1:${port}/entrar" >/dev/null
    exit 0
  fi
  if ! kill -0 "$server_pid" >/dev/null 2>&1; then
    sed -n '1,200p' "$log_file"
    exit 1
  fi
  sleep 1
done

sed -n '1,200p' "$log_file"
exit 1
