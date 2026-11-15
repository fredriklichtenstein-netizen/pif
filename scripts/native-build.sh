#!/usr/bin/env bash
# Build the web app for the native shells and copy it into ios/ and android/.
#   scripts/native-build.sh staging      -> talks to the staging Supabase branch
#   scripts/native-build.sh production   -> talks to production
# Staging values are read from the staging deploy workflow, so there is one
# place to update when the Supabase branch ref changes.
set -euo pipefail
cd "$(dirname "$0")/.."

target="${1:-}"
workflow=.github/workflows/deploy-staging.yml
staging_url=$(sed -n 's/^ *VITE_SUPABASE_URL: //p' "$workflow" | head -1)

case "$target" in
  staging)
    export VITE_SUPABASE_URL="$staging_url"
    export VITE_SUPABASE_PUBLISHABLE_KEY=$(sed -n 's/^ *VITE_SUPABASE_PUBLISHABLE_KEY: //p' "$workflow" | head -1)
    export VITE_SHARE_ORIGIN=$(sed -n 's/^ *VITE_SHARE_ORIGIN: //p' "$workflow" | head -1)
    ;;
  production)
    unset VITE_SUPABASE_URL VITE_SUPABASE_PUBLISHABLE_KEY VITE_SHARE_ORIGIN
    ;;
  *)
    echo "usage: scripts/native-build.sh staging|production" >&2
    exit 2
    ;;
esac

bun run build
# The build regenerates the sitemap; that is the deploy workflow's job.
git checkout -- public/sitemap.xml 2>/dev/null || true

# Same guard as the deploy workflows: never ship the wrong database.
if [ "$target" = staging ]; then
  grep -rqF "$staging_url" dist/assets || { echo "ERROR: build does not reference staging" >&2; exit 1; }
else
  if grep -rqF "$staging_url" dist/assets; then echo "ERROR: production build references staging" >&2; exit 1; fi
fi

bunx cap sync
echo "Native projects now contain the $target build."
