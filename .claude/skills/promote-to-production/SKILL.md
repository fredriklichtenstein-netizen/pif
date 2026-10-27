---
name: promote-to-production
description: The PIF staging-to-production workflow — implement on the `staging` branch, push (GitHub Actions deploys it to staging.pif.today on Cloudflare Pages), get the user's explicit confirmation from testing there, then cherry-pick (never merge) onto `main` and publish production to pif.today via Lovable. Use this whenever making or shipping a code change to the PIF app, when the user says things like "push this to staging", "ship it", "promote to production", "deploy this", or when they confirm a staging test passed ("looks good", "confirmed", "that's fixed", "works now") after a staging fix — that confirmation is the trigger to start the promotion half of this skill. Also covers the Lovable internal-branch sync trap for the production publish and required live-bundle verification, both of which have caused real silent failures on this project.
---

# PIF staging → production promotion

## Why this exists

Real incidents on this project, all documented in `CLAUDE.md`, motivate every non-obvious step:

1. **A confirmed local fix did nothing on staging** because it was never committed/pushed — the
   staging deploy only sees pushed commits.
2. **Cherry-pick, never merge.** Since 2026-10-27 `main` and `staging` carry identical code (the
   Supabase project is chosen by `VITE_SUPABASE_*` env vars, set by the staging workflow; no
   variables = production). Cherry-picking still keeps unconfirmed staging experiments off `main`.
   The two branches have no shared history, so **name commits explicitly** — a path-filtered
   `git log main..staging -- <path>` lists years of unrelated staging commits.
3. **Production still publishes through Lovable** (until the "Replace Lovable publishing" epic's
   H5 moves `pif.today` to Cloudflare Pages). Lovable keeps its own internal editor branch that only
   reconciles with GitHub when its AI agent is invoked via chat; `deploy_project` alone can publish
   stale code while `latest_commit_sha` looks correct. Always sync via `send_message` first.

## Known targets

| Environment | Branch | Git remote(s) | Deployed by | Live domain |
|---|---|---|---|---|
| Staging | `staging` | `pif-staging` (deploys) + `origin` | GitHub Actions `deploy-staging.yml` in `pif-staging` → Cloudflare Pages `pif-staging` | `https://staging.pif.today/` |
| Production | `main` | `origin` | Lovable project `14386dc1-ec27-45d6-a49e-cf90acbe718a` | `https://pif.today/` |

The old "PIF staging" Lovable project (`give-and-get-local.lovable.app`) is disconnected from
GitHub and frozen — never test or verify there. Share-link Worker changes (`workers/share`) deploy
separately: staging automatically, production only via manual dispatch (see CLAUDE.md).

## Procedure

### 1. Implement on staging

Work happens on the `staging` branch. Commit with a real message.

### 2. Push to both staging remotes

```bash
git fetch pif-staging staging
git log --oneline HEAD..pif-staging/staging   # should be empty; if not, merge first, never force-push
git push pif-staging staging:staging
git push origin staging
```

### 3. Watch the staging deploy and verify it

```bash
gh run list -R fredriklichtenstein-netizen/pif-staging -L 2
gh run watch <run-id> -R fredriklichtenstein-netizen/pif-staging --exit-status
curl -s https://staging.pif.today/version.json   # builtAt should be just now
```

The workflow typechecks, builds the exact pushed commit with the staging variables, and refuses to
deploy if the bundle doesn't reference the staging Supabase project. A green run means
`staging.pif.today` serves that commit (about a minute after push). For a specific change, grep the
live bundle for a marker string as in the **verify-deploy** skill.

### 4. Get the user's explicit confirmation

Ask the user to test the specific change on `https://staging.pif.today`. Don't proceed on your own
judgment that the fix "looks right" — the bundle check proves the code shipped, not that it behaves
correctly. Wait for a real confirmation ("confirmed", "works now", "looks good") before step 5.

### 5. Cherry-pick onto main — never merge

```bash
git checkout main
git pull --ff-only origin main
git cherry-pick <staging-commit-sha> [...]     # explicit SHAs, oldest first
git diff main staging --stat                    # expect only public/sitemap.xml
```

Before pushing: `bunx tsc --noEmit -p tsconfig.app.json` and `bunx vitest run`.

A DB migration is promoted separately and directly against production
(`mcp__claude_ai_Supabase__apply_migration` / `execute_sql`), not through this cherry-pick — see
`CLAUDE.md`'s "Staging environment" section for the idempotency requirements. Edge functions are
deployed separately too (`deploy_edge_function` per project).

### 6. Push and publish production

```bash
git push origin main
```

Per-user standing authorization: once the user has confirmed the staging fix, publishing production
does not need a separate ask each time.

1. Record a baseline: `curl -s https://pif.today/version.json` and the main `assets/index-*.js` name.
   Check what the publish will ship — everything on `main` since that `builtAt`, not just your
   commits.
2. Send a sync-only `mcp__claude_ai_Lovable__send_message` to project
   `14386dc1-ec27-45d6-a49e-cf90acbe718a`: "Please pull the latest code from the connected GitHub
   repo's `main` branch, commit `<sha>`, and rebuild. Do NOT make any code changes yourself — this
   is sync-only." It can run long; if it times out, check with `get_project`/`get_message` rather
   than retrying blind.
3. **Diff before trusting it** — the agent has ignored "sync-only" before:
   ```bash
   git fetch origin main && git log --oneline <expected-tip>..origin/main
   ```
   If unexpected commits appear, read the actual diff and cross-check real logic changes against
   what's deployed live. Get the user's explicit confirmation before folding anything auth- or
   data-deletion-adjacent into the promotion.
4. `mcp__claude_ai_Lovable__deploy_project` on the same project.

### 7. Verify production is actually live

Use the **verify-deploy** skill against `pif.today`: the `version.json` `builtAt` moves, and a
marker string from the change is in the served bundle (or a removed string is gone from every
chunk). Don't report done on the API response alone.

### 8. Update Trello

Move the relevant card to Done (or the appropriate list) and leave a short comment noting what
shipped and the production commit SHA. Check the Trello Inbox for anything urgent that surfaced
while you were heads-down on the deploy. If the Trello MCP is unreachable, say so and keep a list of
pending card updates to post once it's back.

### 9. Evaluate whether it's worth a feature announcement

If what just shipped is a significant, user-visible feature — not a small copy/UX tweak or bug fix —
proactively evaluate and report back whether it's worth announcing to users. Don't wait to be
asked, and don't just pose a bare yes/no question: give a short recommendation (worth announcing /
not, and why) covering both channels:

- **Popup**: `feature_announcements` table + `src/components/announcements/AnnouncementModal.tsx`.
- **Email**: `notify_feature_announcement()` → `send-notification-email` edge function's
  `feature_announcement_broadcast` mode (sends to every profile sequentially in one process — never
  loop `net.http_post` per recipient; see `CLAUDE.md`'s pg_net throttling incident).

Verify both mechanisms still exist and match this description before relying on it — things drift.
If the user confirms wording, authoring is direct: insert a row into `feature_announcements`
(bilingual `title_sv`/`title_en`/`body_sv`/`body_en`, `published_at` null for draft or a timestamp
to publish) via `execute_sql`/`apply_migration` against production; the email sends separately via
the edge function's broadcast mode. No admin UI exists for either. Watch out for the backfilled-
watermark trap documented in `CLAUDE.md` if the announcement was authored before this promotion —
`last_seen_announcement_at` defaults can silently hide it from existing users.
