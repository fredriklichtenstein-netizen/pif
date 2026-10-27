---
name: verify-deploy
description: Confirm a PIF deploy (production pif.today or staging.pif.today, both GitHub Actions → Cloudflare Pages) actually serves the expected code, by checking the live bundle
---

## Why this exists

A deploy reporting success doesn't prove the change you care about is what's served. In the Lovable
era (until 2026-10-27) API signals were wrong for up to ~24 hours; with GitHub Actions → Cloudflare
Pages a green run is far more reliable, but a marker check in the live bundle is still the only
proof that a specific change shipped (route code lives in lazy chunks, and other commits may have
landed between checks).

## Known targets

| Environment | Public domain | Deployed by |
|---|---|---|
| Production | `https://pif.today/` | `deploy-production.yml` in `fredriklichtenstein-netizen/pif` (push to `main`) → Pages `pif` |
| Staging | `https://staging.pif.today/` | `deploy-staging.yml` in `fredriklichtenstein-netizen/pif-staging` (push to `staging`) → Pages `pif-staging` |

Both serve `/version.json` (`buildId`, `builtAt`, never cached) — the quick first check that a new
build is out.

## Inputs needed from context (ask if not already known)

- Which environment (production, staging, or both)
- The target commit SHA the deploy should reflect
- The baseline chunk hash from immediately before triggering the deploy (so you know if it moved at all — a hash matching the pre-trigger baseline means nothing has propagated yet, not that the check failed)
- Optionally, a feature-specific marker: a distinctive string (function/variable name) plus which lazy-loaded page/component it should live in (e.g. "Messages" for anything in `ConversationView.tsx`)

## Procedure

1. Fetch the domain root and extract the main chunk:
   ```bash
   curl -s https://pif.today/ | grep -o 'assets/index-[^"]*\.js' | head -1
   ```
2. Compare against the baseline hash. If unchanged, the deploy has not propagated yet — do not
   treat this as inconclusive, it's a clear negative. Do not re-fetch the *same* stale hash
   repeatedly in a tight loop; space checks out (`ScheduleWakeup`, a few minutes apart).
3. If the hash changed, and a content marker was requested, confirm it's really the new build
   rather than an unrelated rebuild:
   ```bash
   curl -s https://pif.today/ -o /tmp/index.html
   MAIN_JS=$(grep -o 'assets/index-[^"]*\.js' /tmp/index.html | head -1)
   curl -s "https://pif.today/$MAIN_JS" -o /tmp/main.js
   # find the lazy chunk reference for the relevant page/component
   grep -oE '"[^"]*<PageOrComponentName>[^"]*-[A-Za-z0-9_]+\.js"' /tmp/main.js | sort -u
   # fetch that chunk and grep for the marker string(s)
   curl -s "https://pif.today/assets/<chunk-name>.js" -o /tmp/chunk.js
   grep -o '<marker1>\|<marker2>' /tmp/chunk.js | sort -u
   ```
4. Report the before/after hash and whether the marker was found. Don't stop at "the hash changed"
   for feature verification — a changed hash confirms *a* new build shipped, not that it's *the*
   build with the expected change (rebuilds can land between checks).

## If it's stuck

- Check the workflow run first (`gh run list -R <repo>`, `gh run view <id> --log-failed`) — a red
  run (typecheck, guard, or wrangler failure) means nothing was deployed.
- If the run is green but `version.json` hasn't moved, the HTML may be cached somewhere in between;
  re-fetch with a cache-busting query (`/version.json?t=$(date +%s)`) before concluding anything.
- Never invent a workaround (manual uploads, guessing at cache purges) — re-run the workflow or
  ask the user.
