---
name: promote-to-production
description: The PIF staging-to-production workflow — implement on the `staging` branch, get the user's explicit confirmation from testing on the "PIF staging" Lovable deployment, then cherry-pick (never merge) onto `main` and publish to pif.today. Use this whenever making or shipping a code change to the PIF app, when the user says things like "push this to staging", "ship it", "promote to production", "deploy this", or when they confirm a staging test passed ("looks good", "confirmed", "that's fixed", "works now") after a staging fix — that confirmation is the trigger to start the promotion half of this skill. Also covers the Lovable internal-branch sync trap and required live-bundle verification, both of which have caused real silent failures on this project.
---

# PIF staging → production promotion

## Why this exists

Three real incidents on this project, all documented in `CLAUDE.md`, motivate every non-obvious
step below:

1. **A confirmed local fix did nothing on staging** because it was never committed/pushed — the
   Lovable deployment can't see uncommitted work. (Happened this session.)
2. **A full `git merge` from `staging` to `main` would pull `staging`'s `client.ts` /
   `generate-sitemap.ts`** — pointed at the staging Supabase project — into production. Cherry-pick
   only the relevant commit(s), never merge.
3. **Lovable maintains its own internal editor branch, separate from GitHub**, that only reconciles
   with GitHub when the project's AI agent is actively invoked via chat. `deploy_project` and the
   dashboard "Publish" button both just (re)publish whatever that internal branch currently holds —
   they do **not** pull from GitHub first. A bare `git push` + `deploy_project` can report success
   (`latest_commit_sha` matching, `agentFinished: true`) while the actually-served bundle remains on
   an older commit, sometimes indefinitely. Always force a sync via `send_message` first.

## Known targets

| Environment | Branch | Git remote(s) | Lovable project_id | Live domain |
|---|---|---|---|---|
| Staging | `staging` | `origin` + `pif-staging` (both, separately) | `553e8288-bdae-4ac5-bcda-f80a4bba2a74` | `https://give-and-get-local.lovable.app/` |
| Production | `main` | `origin` only | `14386dc1-ec27-45d6-a49e-cf90acbe718a` | `https://pif.today/` |

Note: `id-preview--*.lovable.app` URLs are a separate in-editor preview pipeline that can lag real
publishes and may 403 on Mapbox (restricted token) — never use it as the verification target.

## Procedure

### 1. Implement on staging

Work happens on the `staging` branch. Commit with a real message — don't leave changes uncommitted,
even briefly, since the next step depends on them being pushed.

### 2. Push to both staging remotes

```bash
git push origin staging
git fetch pif-staging staging
git merge-base --is-ancestor pif-staging/staging origin/staging && echo "safe" || echo "DIVERGED"
```

Lovable's own two-way sync sometimes pushes small edits directly to `pif-staging`'s `staging`
branch. If the "safe" check fails, `git fetch`/merge before pushing — never force-push over it.
If it's safe (the normal case), fast-forward push:

```bash
git push pif-staging staging:staging
```

### 3. Sync the staging Lovable project and verify it deployed

Even for staging, don't trust a bare push. Send a sync-only chat message to force the internal
branch to reconcile with GitHub:

> `mcp__claude_ai_Lovable__send_message` to project `553e8288-bdae-4ac5-bcda-f80a4bba2a74`:
> "Please pull the latest code from the connected GitHub repo's `staging` branch, commit `<sha>`,
> and rebuild. Do NOT make any code changes yourself — this is sync-only."

This call can run long (observed: client-side wait timed out at 300s while the job kept running
server-side and finished correctly) — if it times out, don't assume failure; check the result with
`mcp__claude_ai_Lovable__get_project` instead of retrying blind.

Then verify the *live served bundle*, not just `latest_commit_sha` / `agentFinished` — see the
**verify-deploy** skill for the exact procedure (fetch the domain root, extract the JS chunk hash,
compare against a pre-trigger baseline, and if a distinctive marker string from the change is
available, grep the bundle for it). A hash that hasn't moved, or a marker that isn't found yet, is a
real negative — poll a few times a short wait apart rather than treating one stale check as
inconclusive.

### 4. Get the user's explicit confirmation

Ask the user to test the specific change on staging. Don't proceed to promotion on your own
judgment that the fix "looks right" from the live bundle alone — the bundle check proves the code
shipped, not that it behaves correctly for the user. Wait for a real confirmation ("confirmed",
"works now", "looks good") before moving to step 5.

### 5. Cherry-pick onto main — never merge

```bash
git fetch origin main
git checkout main
git merge --ff-only origin/main
git cherry-pick <staging-commit-sha> [<earlier-dependency-commit-sha> ...]
```

If the fix builds on an earlier staging commit that was never promoted (check with
`git log origin/main -- <changed-file>` to see what main's version of the file actually has), that
earlier commit needs cherry-picking too, in order, or the later commit won't apply cleanly. Sanity
check before pushing:

```bash
git diff staging main -- <changed-file>   # should be empty if promotion is complete for that file
```

A DB migration is promoted separately and directly against production
(`mcp__claude_ai_Supabase__apply_migration` / `execute_sql`), not through this cherry-pick — see
`CLAUDE.md`'s "Staging environment" section for the idempotency requirements that apply there.

### 6. Push and publish production

```bash
git push origin main
```

Per-user standing authorization: once the user has confirmed the staging fix, publishing production
does not need a separate ask each time.

Same sync-first discipline as staging — send a sync-only `send_message` to project
`14386dc1-ec27-45d6-a49e-cf90acbe718a` (or call `deploy_project`, but be aware the Lovable agent may
publish on its own initiative mid-sync-reply; either way, don't skip the sync message and go
straight to a bare `deploy_project`).

**After any `send_message` to the production project, diff before trusting it**:

```bash
git fetch origin main && git log --oneline <expected-tip>..origin/main
```

A "sync-only" instruction is not always honored — the agent has, at least once, made unrelated code
changes anyway and pushed them straight to `main` (see `CLAUDE.md` for the confirmed incident). If
unexpected commits appear, read the actual diff and cross-check any real logic change against what's
currently deployed live before treating it as safe to keep. Get the user's explicit confirmation
before folding anything auth- or data-deletion-adjacent into the promotion, regardless of assessed
risk.

### 7. Verify production is actually live

Same as step 3: use the **verify-deploy** skill against `pif.today`, project
`14386dc1-ec27-45d6-a49e-cf90acbe718a`. Don't report the task done on the API response alone.

### 8. Update Trello

Move the relevant card to Done (or the appropriate list) and leave a short comment noting what
shipped and the production commit SHA. Check the Trello Inbox for anything urgent that surfaced
while you were heads-down on the deploy.
