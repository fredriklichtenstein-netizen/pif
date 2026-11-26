#!/bin/bash
# Sign a staging test account into staging.pif.today in headless Chromium and save its
# browser state, so a Playwright script can act as that user (see CLAUDE.md, "Testing on
# staging as a user").
#
#   scripts/staging-test/login.sh a|b [outdir]   -> <outdir>/state-<a|b>.json
#
# Accounts: Testare A / Testare B (hej+staging-testare-a|b@pif.community, staging only,
# email notifications off). The staging service-role key is fetched from the Management API
# for this run only (the cloud proxy adds the token) and never written to disk.
# STAGING ONLY: the project ref below is staging's; never point this at production.
set -euo pipefail
WHO="${1:?usage: login.sh a|b [outdir]}"
OUT="${2:-${TMPDIR:-/tmp}/pif-staging-test}"
REF=epxqddygoarwxmbshvvx
mkdir -p "$OUT"; chmod 700 "$OUT"
KEY=$(curl -fsS "https://api.supabase.com/v1/projects/$REF/api-keys?reveal=true" \
  | python3 -c "import sys,json; print(next(k['api_key'] for k in json.load(sys.stdin) if k.get('name')=='service_role'))")
HASH=$(curl -fsS -X POST "https://$REF.supabase.co/auth/v1/admin/generate_link" \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
  -d "{\"type\":\"magiclink\",\"email\":\"hej+staging-testare-$WHO@pif.community\"}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('hashed_token') or d['properties']['hashed_token'])")
unset KEY
node "$(dirname "$0")/login.cjs" "$WHO" "$HASH" "$OUT"
chmod 600 "$OUT/state-$WHO.json"
