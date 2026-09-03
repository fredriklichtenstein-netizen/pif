# PIF (Pay It Forward)

Swedish-language neighborhood item-sharing PWA. Live at pif.today / app.pif.community.
MVP just launched with real users — treat all changes with production-appropriate caution.
No experimental changes to auth, payments-adjacent flows, or data deletion without explicit confirmation.

## Stack

- Frontend: React + TypeScript, Vite, deployed via Lovable's publish pipeline
- Backend: Supabase, production domains pif.today / app.pif.community
- Maps: Mapbox GL JS
- Email: Resend (custom SMTP for Supabase Auth, plus transactional emails via Edge Functions)
- Mobile: Capacitor is in the project for an eventual native iOS/Android build (not started)
- i18n: react-i18next, Swedish + English (`src/locales/{sv,en}/*.json`)

## Supabase project ID

Production project ID is **`heurpehcwbhohwklqnir`** (confirmed from `src/integrations/supabase/client.ts`,
the actual runtime client config).

**Known trap:** `supabase/config.toml` in this repo has `project_id = "fzejimpdheswqrojjvmf"` — this is
stale/wrong and does NOT match the real production project. Don't trust it for CLI linking or anything else;
always use `heurpehcwbhohwklqnir` and verify against `src/integrations/supabase/client.ts` if in doubt.

## Core domain concepts

- **"pifs"** (`item_type='offer'`) — one-to-one giveaway, single selected receiver
- **"wishes"/önskningar** (`item_type='request'`) — supports multiple simultaneous selected fulfillers
- This distinction runs deep through the data model — do not assume symmetry between the two flows

## Database discipline

- Always pull the LIVE function body before editing any Postgres function:
  ```sql
  SELECT pg_get_functiondef(p.oid) FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname = '[function_name]'
  ```
  Local/repo SQL files are frequently stale relative to the live database.
- `CREATE OR REPLACE FUNCTION` with a changed parameter list creates an ADDITIONAL overload, not a
  replacement — always `DROP FUNCTION IF EXISTS` with the exact old signature first.
- `storage.objects` cannot be deleted via direct SQL — blocked by a `protect_delete()` trigger.
  Deletion must go through the Storage API.
- The `items` table uses `pif_status`, not `status`.
- The `conversations` table has no participant columns — joined via `conversation_participants`.
- PostgREST cannot auto-embed across the `auth.users` boundary — fetch `public.profiles` separately
  using `user_id`.
- RLS policies should use `(SELECT auth.uid())` rather than bare `auth.uid()` for performance.
- Test/dummy data has been fully wiped — the database is clean and production-ready. Don't reintroduce
  test data casually.
- **`auth.users`'s text columns (`email_change`, `email_change_token_current`, `email_change_token_new`,
  `confirmation_token`, `recovery_token`, etc.) must never be set to SQL `NULL` via direct SQL — always
  `''` (empty string) instead.** Nothing at the Postgres schema level enforces this (all nullable, no
  constraint), but GoTrue's Go code scans them into non-nullable strings; a `NULL` there breaks login
  outright for that user with `"error finding user: sql: Scan error... converting NULL to string is
  unsupported"`. Hit this directly while manually resetting a test account's email after verifying
  `get_pending_email_change()`'s semantics — fixed by rewriting the `NULL`s back to `''`. Also:
  `auth.identities.email` is a generated column (derived from `identity_data->>'email'`) — update
  `identity_data` via `jsonb_set`, never `email` directly.

## Mapbox

Mapbox GL JS requires a DEFINITE (not min-height) container height at initialization. `min-h-screen-dvh` /
`flex-1` chains can resolve to 0px and break map rendering entirely — this has happened twice. Any
change near the Map page's layout must be tested on a real device before considering it done.

## Email domains: pif.today SENDS, pif.community RECEIVES

These are not interchangeable and the difference is invisible in code:

- **`pif.today`** — verified in Resend for *sending*, but has **no MX record**. Nothing addressed to
  it can ever arrive. Use it only as a `From`/sender.
- **`pif.community`** — has MX (Google Workspace). This is the real inbox, and the address the
  privacy policy lists as the contact.

Routing the in-app feedback form to `hej@pif.today` silently black-holed every submission for a week
(2026-07-28 → 08-04): the app and edge function returned 200 throughout, Resend accepted the sends,
and they then bounced / sat in `delivery_delayed` where nobody was looking. **Symptom of this class
of bug is total silence, not an error** — if mail "isn't arriving", check Resend's per-message
*status* (not just that a send happened) and `dig MX <domain>` before touching any code. Recovered
message bodies are retrievable from Resend's log via `get-email` even for bounced sends.

For the same reason, never create an *account* on `@pif.today` — it can't receive confirmation or
password-reset mail. One such user existed (`hej@pif.today`, never signed in) and was deleted
2026-08-04.

## Supabase Auth emails (templates + PWA deep-linking)

All 13 auth email templates are brand-styled (bilingual sv/en, logo, `#00CC99` CTA) and managed via
the Management API (`PATCH /v1/projects/<ref>/config/auth`, fields `mailer_templates_*_content` /
`mailer_subjects_*`), NOT the dashboard. Keep production and staging in sync — staging had drifted
completely (still on Supabase defaults) until it was synced from production.

**Never use `{{ .ConfirmationURL }}` in a template with a link.** It resolves to
`<project-ref>.supabase.co/auth/v1/verify?...&redirect_to=...`, i.e. a *different origin* than the
app. That breaks two things at once:
- The installed PWA can't capture it (out of scope) → always opens a fresh, usually logged-out browser window.
- It routes through the PKCE `?code=` exchange, which **cannot work across browsers/devices** — the
  code verifier is stored locally, so a link requested in one browser and opened in another (e.g.
  Mail opening Safari) fails with `AuthPKCECodeVerifierMissingError`.

Use `{{ .SiteURL }}/<route>?token_hash={{ .TokenHash }}&type=<otp_type>` instead, verified client-side
with `supabase.auth.verifyOtp({ token_hash, type })` — no locally-stored secret, works from any
browser/device. Routes: `/reset-password` (`type=recovery`), `/email-confirmation`
(`type=signup|email_change|magiclink|invite`). Both pages keep `?code=` and legacy `#access_token=`
paths as fallbacks for already-sent emails.

**PWA deep-linking depends on origin/scope agreement, not on anything in the email itself.**
`pif.today` and `app.pif.community` are two separate origins both serving the app, and
`app.pif.community/manifest.json` 302-redirects cross-origin to `pif.today/manifest.json` (Lovable/DNS
level, not changeable from the repo). Since a PWA's scope derives from its *manifest URL*, installs
from either domain end up scoped to `pif.today`. So `site_url` **must stay `https://pif.today`** —
pointing it at `app.pif.community` puts every email link outside the installed app's scope and macOS
hands them to Safari (this was the actual bug). `public/manifest.json` declares `id`/`scope`/
`handle_links` explicitly so identity doesn't depend on which domain served the install. Changing
`id`/`scope` can make Safari treat it as a new app — an existing Dock install may need re-adding.
Staging's `site_url` is `https://give-and-get-local.lovable.app` (it also wrongly pointed at
production's domain until this was found).

**That origin/scope fix only covers hand-off *within* the browser (a link opened by the browser
itself lands in the right scope). It does NOT make another app — Mail, Gmail — hand a tapped link
to the installed PWA at all, on mobile.** Confirmed 2026-09-03 (Trello B13): notification email
links correctly open the installed PWA on desktop but open a plain mobile browser instead, even
with `site_url`/scope already correct. Root cause is structural, not a repo bug: that OS-level
"this URL belongs to an installed app" handoff is what iOS Universal Links
(`apple-app-site-association`) and Android App Links / Digital Asset Links (`assetlinks.json`)
exist for — neither file exists in this repo, and both require a real native app (signing
entitlements for iOS, an APK's signature for Android) to register against, which this project
doesn't have (Capacitor is present but no native build has ever shipped). `handle_links` and
`apple-mobile-web-app-capable` in the manifest/`index.html` only affect behavior *inside* the
browser/PWA — they're irrelevant to a tap originating in another app. Desktop is unaffected
because desktop OS/browser combos register an installed PWA with the system's own URL-handling
layer more deeply than mobile's "Add to Home Screen" does. **No code-level fix is possible for
this without shipping an actual native app wrapper with proper entitlements — don't re-attempt a
manifest/scope tweak for it.**

Other gotchas: `smtp_max_frequency` is the minimum gap between sends *within one request* — secure
email change sends two emails (old + new address) in a single `updateUser({email})` call, so a high
value (it was 60s) makes that call unable to finish inside any sane client timeout and **no emails
arrive at all**; it's 5s now, and that call gets a 25s client timeout vs 15s elsewhere.
`security_update_password_require_reauthentication` is on, so `updateUser({password})` fails with
`reauthentication_needed` on sessions older than 24h and needs the `reauthenticate()` + `nonce` flow.

## Edge Functions

Tracked in repo (`supabase/functions/`): `analyze-image`, `delete-account`, `prewarm-og`,
`send-report`, `send-feedback`, `get-mapbox-token`. Deployment to Supabase is a distinct step from
writing the code — always deploy after editing. Production also has `og-preview` deployed, which
isn't tracked in this repo; conversely `analyze-image` is tracked but not currently deployed to
production. Don't assume the repo and what's actually live match — check with
`mcp__claude_ai_Supabase__list_edge_functions` / `get_edge_function` before assuming a tracked
file reflects reality (`get-mapbox-token` was a real example of this: the tracked version called
`supabase.auth.getClaims()`, a method that doesn't exist on the pinned SDK version, so it could
never have worked if deployed — production has been running a much simpler, intentionally
unauthenticated version all along, reading a secret literally named `MAPBOX_TOKEN`, not
`MAPBOX_PUBLIC_TOKEN`. Fixed in the repo as of commit `4ad996c1`. Map/feed browsing is
intentionally public — do not add an auth check back to this function).

`send-notification-email` (added for the email-notifications feature) sends real email via Resend
for new messages, comments, and feature announcements, triggered from Postgres via `pg_net` using
a shared secret (`x-internal-secret`, stored in both Vault and as an edge function secret) since
there's no user JWT in a trigger/cron context. **Trap: don't loop `net.http_post` once per
recipient from SQL for a bulk send.** `notify_feature_announcement()` originally did exactly that
for its "email every profile" broadcast — pg_net's background worker dispatches its whole queue in
one burst regardless of how the enqueue calls were spaced out in SQL (confirmed directly: spacing
enqueues with `pg_sleep(0.15)` between each of 149 calls still produced 149 responses with the
*exact same* timestamp), blowing straight through Resend's 10 req/sec cap — 133 of 149 sends
failed with `rate_limit_exceeded` the first time this ran for real, and a second attempt with the
same per-profile-loop pattern still failed 129/149 even with the sleep in place. Fixed by adding a
`feature_announcement_broadcast` mode to the edge function itself: **one** `net.http_post` call
triggers **one** edge function invocation that loops every profile and sends sequentially with an
awaited delay in a single continuous Deno process — throttling only works when it happens inside
one process, not spread across many independently-dispatched async calls from Postgres.
## Staging environment (Supabase branch + Lovable remix)

A parallel staging pipeline exists so changes can be tested before touching production. Pieces:

- **Two GitHub repos, not one.** `fredriklichtenstein-netizen/pif` (production, tracks `main`) and
  `fredriklichtenstein-netizen/pif-staging` (created automatically when the Lovable project was
  remixed — a fully independent repo, NOT a fork, with no shared git history). Both need the
  `staging` branch pushed to them for the pipeline to work; a local `pif-staging` git remote is
  the easiest way (`git push pif-staging staging:staging`). Lovable's own two-way sync pushes
  commits directly to `pif-staging`'s `staging` branch sometimes (small UI edits) — always
  `git fetch`/merge before pushing there, never force-push.
- **"PIF staging" Lovable project** (a remix of the production project) is wired to
  `pif-staging`'s `staging` branch, and its `client.ts` / `generate-sitemap.ts` point at a
  dedicated Supabase branch (currently project ref `epxqddygoarwxmbshvvx` — **this ref changes
  every time the branch is deleted/recreated**, since Supabase assigns a new one each time; both
  files need updating whenever that happens).
- **`IS_STAGING` export** in `client.ts` (`true` whenever `SUPABASE_URL` isn't production's) drives
  a small "STAGING" pill (`src/components/debug/StagingBadge.tsx`, mounted in `App.tsx`) — a
  permanent visual guard against mistaking one environment's preview for the other's (this
  actually happened once while building this pipeline: the map showed "live" pins that turned out
  to be real production data because the branch switch hadn't actually taken effect yet).
- **Production's tracked migration history had a real gap.** Migrations `01_profiles` through
  `08_views_and_counters` (March 2026) reflect a schema (`posts`, `post_likes`, `post_categories`,
  etc.) that was later restructured directly against the live database — the `posts`→`items`
  rename, and new `conversations`/`conversation_participants`/`messages`/`interests`/`likes`/
  `ratings` tables — without any of it ever being captured as a tracked migration. This made every
  fresh Supabase branch diverge from production and eventually fail to replay. Fixed with one
  corrective migration (`reconcile_schema_with_production`, version `20260601000000`, inserted
  directly into `supabase_migrations.schema_migrations` — metadata only, never executed against
  production's live schema, which was already correct) that drops what 01-08 create and rebuilds
  from an authoritative `pg_dump` of production's real schema. A fresh branch now replays cleanly
  end-to-end. Two follow-on landmines already hit and fixed the same way (patch the recorded
  `statements` in place, don't re-execute): a migration doing `DROP COLUMN gender` and one doing
  `ADD COLUMN visibility_radius_km` both lacked `IF EXISTS`/`IF NOT EXISTS` guards, which is fine
  replaying against production once but breaks a fresh branch replay. **Any new migration must be
  idempotent** (`IF EXISTS`/`IF NOT EXISTS`/`CREATE OR REPLACE`) or it will silently re-break fresh
  branch creation the next time it's needed.
- **`is_moderator()`** references `public.user_roles`, which doesn't actually exist in production
  (dropped at some point without updating the function) — it's already dead/broken there, so
  branches intentionally don't recreate `user_roles` either. Not a bug to fix, just a known
  pre-existing gap.
- **Storage buckets aren't part of migration replay either** — same category of gap as the schema
  one above. Production has 5 buckets (`avatars`, `post-media`, `profile-photos`, `post-images`,
  `brand-assets`); only `avatars`/`post-media` were ever captured by a tracked migration, so a
  fresh branch starts without the other 3 (and their `storage.objects` RLS policies), breaking
  profile/post creation with "Bucket not found". Fixed the same way: a corrective migration
  (`add_missing_storage_buckets_and_policies`, version `20260717160000`) inserts the missing
  `storage.buckets` rows and recreates their policies. **Note**: `CREATE POLICY IF NOT EXISTS` is
  not valid Postgres syntax (caught this before it broke a future branch) — the idempotent pattern
  for policies is `DROP POLICY IF EXISTS "name" ON table; CREATE POLICY "name" ...`, mirroring the
  `DROP FUNCTION IF EXISTS` pattern already used for functions.
- **Edge Functions and their secrets are not automatically synced** to a new Supabase branch —
  deploy each function and `supabase secrets set` (CLI, linked via `--project-ref`, no DB password
  needed — Management-API-based auth) separately. Direct Postgres connections (e.g. for
  `pg_dump`/`psql`) require the project's IPv4 add-on enabled (Supabase direct/pooler hosts are
  IPv6-only by default) plus the actual DB password, which is only shown once and must be reset if
  forgotten (safe to do — the app never uses the DB password directly, only the anon/publishable
  key over the REST API).
- **Promotion workflow**: implement on `staging`, user tests in "PIF staging", confirm, then
  cherry-pick (never a full `git merge`) the relevant commits onto `main` — a full merge would try
  to pull `staging`'s `client.ts`/`generate-sitemap.ts` (pointed at the staging Supabase project)
  into production. Any new DB migration gets promoted separately, directly via
  `mcp__claude_ai_Supabase__execute_sql`/`apply_migration` against the production project ID. Once
  the user has confirmed a fix works, publishing production via
  `mcp__claude_ai_Lovable__deploy_project` (project `14386dc1-ec27-45d6-a49e-cf90acbe718a`) is
  pre-authorized — no need to ask each time. **Don't wait for the editor-preview build
  (`id-preview-*.lovable.app`) to catch up before calling `deploy_project`** — that preview
  pipeline is separate from what `deploy_project` actually builds/publishes, and can lag the
  pushed commit by many minutes for no reason connected to publish-readiness. Just push, then call
  `deploy_project` directly; verify success afterward via `get_project`'s `latest_commit_sha` (it
  will match promptly) and by grepping the real domain's served bundle for a marker string from the
  change — checking only the main `index-*.js` chunk can give a false "missing" since route-level
  code lives in separate lazy-loaded chunks.
  **Trap confirmed on staging too, and there `latest_commit_sha`/screenshot are NOT sufficient on
  their own** — both updated (commit sha matched, screenshot timestamp fresh) while the actual JS
  served from `give-and-get-local.lovable.app` was still running code from ~4 commits earlier;
  took ~40s longer than the API signals suggested before the real bundle caught up. The only
  reliable check is fetching the live served bundle directly and grepping for a marker string from
  the change, same as the production advice above — do this for staging `deploy_project` calls too,
  don't stop at the API response. Concretely: `fetch('<staging-url>/')` → regex out
  `assets/index-*.js` → fetch that → regex out the specific lazy chunk name (e.g.
  `ItemCardWrapper-*.js`) → fetch that → search its text for the marker. Poll (re-fetch from
  scratch, chunk hashes change each build) until the marker appears; don't trust one stale check.
  **Confirmed once (2026-08-28) this can go further: a genuinely stuck publish, not just slow.**
  On staging, `deploy_project` and even a manual click of "Publish" in the Lovable dashboard both
  reported success (`status: ready`, `updated_at` moved) while `get_project`'s `latest_commit_sha`
  stayed on the previous commit through 3 retriggers and ~25+ minutes — neither path was pulling
  the newest GitHub commit into the project at all. Root cause: **Lovable maintains its own
  internal editor branch, separate from the connected GitHub repo, that only reconciles with
  GitHub when the project's AI agent is actively invoked via chat (`send_message`) — `deploy_project`
  and the dashboard "Publish" button both just (re)build/publish whatever Lovable's *internal*
  branch currently holds, they do not force a git pull first.** If retriggering a normal publish
  doesn't clear a stale `latest_commit_sha` within a few minutes, sending an actual chat message to
  the project (e.g. "sync the latest code from GitHub branch X commit Y and rebuild — do not make
  code changes") is the forcing function that actually works. **But that request can still be
  overridden**: even with an explicit "do NOT make any code changes yourself" instruction, the
  agent went ahead and modified 4 unrelated files anyway ("Cast 4 Supabase query results to any",
  commit `21c9d26d`/`267c2f3c`), citing some internal directive that took precedence over the
  explicit instruction. The changes happened to be reviewed as harmless (pure type-level casts,
  no runtime difference) and were kept, but **always diff every file the agent touches against what
  was actually requested before trusting or promoting it** — do not assume "don't touch code" will
  be honored. Lovable's own two-way sync then pushes whatever its internal branch has (including
  any such unrequested edits) back to `pif-staging`'s `staging` branch — reconcile that back into
  the canonical git history with `git fetch` + merge/cherry-pick, don't just leave it diverged.
- **The user has a Lovable feature enabled that auto-fixes build errors on BOTH projects every
  morning at 6am — including production.** Confirmed 2026-08-30: a scoped, sync-only `send_message`
  to the **production** project ("pull commit X, make no code changes") triggered the agent to also
  fix unrelated Deno typecheck errors in `delete-account`/`send-notification-email`, and its
  two-way sync pushed the result **straight to `origin/main`** — no staging, no review, before
  `deploy_project` was ever called. This is a different mechanism from the instruction-override
  above (that was the agent ignoring a direct request; this is a legitimate standing feature the
  agent was right to act on) but has the same practical effect: unreviewed commits can land on
  production's `main` between one turn and the next. **After ANY `send_message` to a project
  (even a "just sync" one), diff `origin/main` against what you expect before calling
  `deploy_project`** — `git fetch origin main && git log --oneline <expected-tip>..origin/main`.
  Don't assume a sync-only request stayed sync-only. If unexpected commits appear: read the actual
  diff (`git diff <expected-tip> origin/main`) rather than trusting the agent's self-reported
  summary, cross-check any real (non-type-only) logic change against what's *actually deployed*
  live (`mcp__claude_ai_Supabase__get_edge_function`) before judging risk — the repo and live can
  already differ for unrelated reasons (see the `get-mapbox-token` gap above), and a "fix" can turn
  out to just be the tracked file catching up to reality. Get the user's explicit confirmation
  before folding anything auth/data-deletion-adjacent into a promotion regardless of assessed risk.
  Recommended fix (not yet done, needs the user in the Lovable dashboard): disable the auto-fix
  job on the **production** project specifically; it's low-stakes left on staging since anything
  it does there still passes through this same review before promotion.
- **Trap: backfilled watermark/timestamp columns can race against pre-curated content.** The
  `feature_announcements` table's `add_feature_announcements` migration gave existing rows
  `last_seen_announcement_at DEFAULT now()` so nobody sees a historical backlog on rollout — but
  because that migration was promoted to production a day *after* the 3 real announcements were
  authored/published on staging, applying it backfilled every existing user's watermark to a
  timestamp *after* those announcements' `published_at`, silently hiding them from every current
  user. Fixed with a one-off `UPDATE profiles SET last_seen_announcement_at = NULL` across all
  production rows post-promotion. General lesson: when a migration adds a `DEFAULT now()`
  watermark/seen-at column meant to gate pre-existing rows against new content, check whether any
  of that content was already authored before promotion — if so, the backfilled default will
  likely land after it and need a manual correction pass.
- **Mapbox token**: swapped from the account's unrestricted default public token to a
  URL-restricted one. Mapbox tokens don't support wildcards, but subdomains are auto-authorized
  (adding `example.com` also covers `anything.example.com`), so the allowed list is just the four
  root domains: `pif.today`, `app.pif.community`, `give-and-get-local.lovable.app`,
  `pif-pay-it-forward.lovable.app`. Lovable's dynamic in-editor preview URLs
  (`id-preview--*.lovable.app`) are intentionally NOT covered — they're siblings of the two
  published domains above, not subdomains, so covering them would require the bare `lovable.app`
  domain, which would authorize every other project on Lovable's shared domain too. Trade-off
  accepted: maps may 403 in the Lovable in-editor preview while building, but work fine on the
  real published staging/production URLs (which is what the deploy-verification workflow above
  actually checks). Set via `supabase secrets set MAPBOX_TOKEN=... --project-ref <ref>` on both
  projects — the `get-mapbox-token` edge function picks up a changed secret immediately, no
  redeploy needed.

## Git / deployment workflow

- Lovable has two-way GitHub sync with this repo and is used only for its "Publish" button to push
  the repo's current state live. Do not rely on Lovable to write code — it has reconstructed code/SQL
  from stale internal state before, causing real bugs.
- Repo: `fredriklichtenstein-netizen/pif`. Push access from a cloud/web Claude Code session may be
  blocked (proxy/GitHub App write scope issue, unresolved as of this writing) — a local Claude Code
  session authenticated via `gh auth login` has confirmed working push access instead.
- For anything touching layout/rendering (especially Map), confirm via description or screenshot
  that it still works before considering a task done.
