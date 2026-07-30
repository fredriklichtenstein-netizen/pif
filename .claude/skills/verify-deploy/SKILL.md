---
name: verify-deploy
description: Confirm a Lovable publish for PIF actually landed on the live domain, not just that the API says it did
---

## Why this exists

`mcp__claude_ai_Lovable__get_project` reporting `status: "ready"`, `agentFinished: true`, and the
correct `latest_commit_sha` does **not** mean the public domain is serving that build. This has
been confirmed wrong twice: once for up to ~9 minutes (documented in the main CLAUDE.md), and once
for a full ~24 hours, where the build had genuinely completed (proven by a freshly rendered
screenshot at the exact target commit) but the publish/promote step to the public domain never
ran. The only trustworthy signal is fetching the live bundle directly.

## Known targets

| Environment | Public domain | Lovable project_id |
|---|---|---|
| Production | `https://pif.today/` | `14386dc1-ec27-45d6-a49e-cf90acbe718a` |
| Staging | `https://give-and-get-local.lovable.app/` | `553e8288-bdae-4ac5-bcda-f80a4bba2a74` |

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

- Re-triggering `deploy_project` is the only forcing mechanism available (there's no separate
  cache-purge or force-publish API). It's safe to retry — it's the same action as clicking
  "Publish" in the Lovable UI — but don't loop it. A normal propagation delay is well under 10
  minutes; if a retrigger doesn't resolve it within ~5 minutes, that points to a platform-side
  issue rather than something fixable by retrying again immediately.
- If it has been stuck for an extended period (this happened once for ~24h), tell the user plainly
  rather than continuing to poll silently — it may need a Lovable support ticket.
- Never invent a workaround (manual file upload, CDN purge guesses, etc.) — this project has no
  access path to the live domain other than the Lovable publish pipeline.
