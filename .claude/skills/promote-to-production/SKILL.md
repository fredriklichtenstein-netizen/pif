---
name: promote-to-production
description: The PIF staging-to-production workflow — implement on the `staging` branch, push (GitHub Actions deploys it to staging.pif.today on Cloudflare Pages), get the user's explicit confirmation from testing there, then cherry-pick (never merge) onto `main` and push, which deploys production to pif.today via GitHub Actions → Cloudflare Pages. Use this whenever making or shipping a code change to the PIF app, when the user says things like "push this to staging", "ship it", "promote to production", "deploy this", or when they confirm a staging test passed ("looks good", "confirmed", "that's fixed", "works now") after a staging fix — that confirmation is the trigger to start the promotion half of this skill. Also covers required live-bundle verification, which has caught real silent failures on this project.
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
3. **Pushing `main` deploys production** (since 2026-10-27; Lovable is out of the publish path).
   The Lovable production project still has two-way sync with `main` until H6, so anything its
   agent commits would deploy too — never `send_message` it, and check `origin/main` for unexpected
   commits before cherry-picking.

## Known targets

| Environment | Branch | Git remote(s) | Deployed by | Live domain |
|---|---|---|---|---|
| Staging | `staging` | `pif-staging` (deploys) + `origin` | GitHub Actions `deploy-staging.yml` in `pif-staging` → Cloudflare Pages `pif-staging` | `https://staging.pif.today/` |
| Production | `main` | `origin` | GitHub Actions `deploy-production.yml` in `pif` → Cloudflare Pages `pif` | `https://pif.today/` |

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

### 6. Push main (this deploys production)

Per-user standing authorization: once the user has confirmed the staging fix, deploying production
does not need a separate ask each time.

1. Record a baseline: `curl -s https://pif.today/version.json`. Check what the push will ship —
   everything on `main` since that `builtAt`, not just your commits.
2. `git push origin main`.
3. Watch the run:
   ```bash
   gh run list -R fredriklichtenstein-netizen/pif -w "Deploy production (Cloudflare Pages)" -L 1
   gh run watch <run-id> -R fredriklichtenstein-netizen/pif --exit-status
   ```
   The workflow typechecks, builds with no `VITE_SUPABASE_*` (= production), and its guard refuses
   to deploy if the bundle lacks the production ref or contains the staging ref /
   `share-staging.pif.today`. A red run means production is unchanged — read `--log-failed`.

### 7. Verify production is actually live

`curl -s https://pif.today/version.json` — `builtAt` should be the run's build time. For a specific
change, use the **verify-deploy** skill to find a marker string in the served bundle (or confirm a
removed string is gone from every chunk). Rollback: `gh run rerun` an older green run, or
`git revert` + push.

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
