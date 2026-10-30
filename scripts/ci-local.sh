#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export BACKEND_URL=http://127.0.0.1:3333
export NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_test

bun install --frozen-lockfile
bun run validate
bun run validate:dependencies
./scripts/smoke-next-build.sh
