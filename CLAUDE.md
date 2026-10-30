# PIF (Pay It Forward)

Swedish-language neighborhood item-sharing PWA. Live at pif.today / app.pif.community.
MVP just launched with real users — treat all changes with production-appropriate caution.
No experimental changes to auth, payments-adjacent flows, or data deletion without explicit confirmation.

## Stack

- Frontend: React + TypeScript, Vite. Both environments deploy via GitHub Actions → Cloudflare
  Pages (production since 2026-10-27; see "Staging environment" → Promotion workflow). Lovable is
  no longer in the publish path; retiring it fully is H6 of the "Replace Lovable publishing" epic.
- Backend: Supabase, production domains pif.today / app.pif.community
- Maps: Mapbox GL JS
- Email: Resend (custom SMTP for Supabase Auth, plus transactional emails via Edge Functions)
- Mobile: Capacitor is in the project for an eventual native iOS/Android build (not started)
- i18n: react-i18next, Swedish + English (`src/locales/{sv,en}/*.json`)
- Analytics: Cloudflare Web Analytics (cookieless), enabled on the `pif` Pages project only — Pages
  injects the beacon into HTML on deploy, so there's no code for it. The privacy policy
  (`src/pages/Privacy.tsx`, section 3 + 6) describes it; keep the two in step if this changes.
- Domains: `pif.community` and `www.pif.community` 301 to `https://pif.today` via a zone Redirect
  Rule on proxied `AAAA 100::` placeholders (the old Wix site was removed 2026-10-27). Its MX/SPF/
  DKIM/DMARC records are Google Workspace mail — leave them alone.

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
`app.pif.community/manifest.json` 302-redirects cross-origin to `pif.today/manifest.json`. **That
redirect comes from our share-link Worker, `workers/share`** (Cloudflare Worker `pif-share`, route
`app.pif.community/*`, record `AAAA app 100::` proxied — since 2026-10-27; before that it was the
third-party "Hado" prerender service at A 137.66.32.95, DNS-only). The Worker 302s browsers to the
same path on `pif.today` and gives link-preview crawlers an HTML page with item-specific OG tags
for `/item/<id>` (see "Share links / link previews" below). Only `pif.today` actually hosts the app.
Since a PWA's scope derives from its *manifest URL*, installs
from either domain end up scoped to `pif.today`. So `site_url` **must stay `https://pif.today`** —
pointing it at `app.pif.community` puts every email link outside the installed app's scope and macOS
hands them to Safari (this was the actual bug). `public/manifest.json` declares `id`/`scope`/
`handle_links` explicitly so identity doesn't depend on which domain served the install. Changing
`id`/`scope` can make Safari treat it as a new app — an existing Dock install may need re-adding.
Staging's `site_url` is `https://staging.pif.today` since 2026-10-27 (before that the Lovable
staging URL; it also once wrongly pointed at production's domain). Staging's `APP_URL` edge
function secret (link base for notification emails) matches it.

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

Tracked in repo (`supabase/functions/`): `analyze-image`, `delete-account`,
`send-report`, `send-feedback`, `get-mapbox-token`, `send-notification-email`, `purge-draft-images`. Deployment to Supabase is a distinct step from
writing the code — always deploy after editing. `og-preview` and `prewarm-og` were removed from
the repo and deleted from both Supabase projects on 2026-10-27 (superseded by `workers/share`); also `unsubscribe-notification` is tracked.
`analyze-image` is tracked but not currently deployed to production. `send-report` was reconciled
with live on 2026-10-26 (production v13 == repo). That pass found two traps: the old tracked
version selected `profiles.full_name`/`email`, which don't exist (every report would have shown
"Okänd användare"), and it sent from `alwaysremember.se`, which staging's Resend key isn't
authorized for (403). **The function still returned 200 and the app showed success, because the
`reports` row saved — a report email can fail completely silently.** It now sends from
`reports@pif.today` like every other function. If report mail seems missing, read the function's
logs (`query_logs`, source `function_logs`, look for `Resend email failed`) — not just whether the
report was stored. Don't assume the repo and what's actually live match — check with
`mcp__claude_ai_Supabase__list_edge_functions` / `get_edge_function` before assuming a tracked
file reflects reality (`get-mapbox-token` was a real example of this: the tracked version called
`supabase.auth.getClaims()`, a method that doesn't exist on the pinned SDK version, so it could
never have worked if deployed — production has been running a much simpler, intentionally
unauthenticated version all along, reading a secret literally named `MAPBOX_TOKEN`, not
`MAPBOX_PUBLIC_TOKEN`. Fixed in the repo as of commit `4ad996c1`. Map/feed browsing is
intentionally public — do not add an auth check back to this function).

`purge-draft-images` (2026-10-28) removes Storage images of drafts deleted by the daily
`_cleanup_stale_drafts()` job (same `x-internal-secret` pattern; owner-folder-only, skips URLs an
item still uses). `send-notification-email` was found **behind live** on 2026-10-28 (live v16 had
per-recipient announcement language + a 30-day line in stale reminders that git lacked) — synced.
Deploy functions with the Management API (`POST /v1/projects/<ref>/functions/deploy?slug=<name>`,
multipart `metadata` + `file`) — the local `supabase functions deploy/download` CLI exits silently
here.

**Posts open in the feed, not on a page of their own** (since 2026-10-30). The standalone item
page is gone; `/item/<id>` and `/share/<id>` are redirects (`src/pages/PostRedirect.tsx`) to
`/feed?post=<id>` (query params like `comment`/`selectReceiver` kept), which looks up the post's
bucket (archived/completed → archived view), pages until it's loaded, clears filters hiding it,
then scrolls to and highlights it — or pins it above the feed (`DeepLinkedPost`) when it can't be
placed (too far down, archived for a logged-out viewer) or says it's gone. Build links with
`src/lib/feedLinks.ts` (`feedPostPath`); in-app notification `action_url`s are still stored as
`/item/<id>` and rewritten at render time by `toFeedLink`, and `send-notification-email` builds
`/feed?post=` links itself. Map pins open a thumbnail popup; tapping it (or the pin again)
opens the full card over the map (`MapPostCard`), whose "Visa i flödet" is the way off the map.
Drafts are the feed's `?view=drafts` view (`/drafts` redirects there).

The feed shows active and non-active (archived/completed) posts together by default for
logged-in users; "Dölj ej aktiva" in Filtrera hides the non-active ones. In the feed data path
(`useOptimizedFeed`, `getOptimizedPosts`, `getPosts`, `fetchFeedTypeCounts`) the flag is
`includeInactive` = "include non-active alongside active" — there is no archived-only mode any
more. The toolbar is just Filtrera + sort, with removable chips for active filters; "Inlägg"
(alla / mina / visat intresse / utkast) in Filtrera is one choice over `onlyOwnPosts`/
`onlyInterested` (shared with the map) and the drafts view.

Feedback screenshots: html2canvas copies a WebGL canvas (Mapbox) as blank unless it was created
with `preserveDrawingBuffer: true` — all three maps set it; keep it on any new map.

**Drafts & scheduled posts** live in `item_drafts` (owner-only RLS), never in `items` — `items`
is public-read and every "active" filter would leak a new status. `publish_draft()` copies a draft
into `items` (created_at/stale clock = publish time) and deletes it; cron
`publish-scheduled-drafts` (*/5) does the same for due drafts and notifies (prefs
`push_scheduled_published` / `email_scheduled_published`, opt-out); `cleanup-stale-drafts`
(daily) deletes unscheduled drafts untouched for 90 days. Account deletion covers drafts via the
profiles cascade + the `images/<uid>` purge.

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
## Share links / link previews (`workers/share`)

Shared item links are `<SHARE_ORIGIN>/item/<id>` (`src/lib/shareOrigin.ts`, `VITE_SHARE_ORIGIN`,
default `https://app.pif.community`; staging builds use `https://share-staging.pif.today`). Both
hostnames are served by the Worker in `workers/share` (production `pif-share`, staging
`pif-share-staging`, config in `wrangler.toml`), deployed by `.github/workflows/deploy-share-worker.yml`
— staging automatically on push, **production only via manual "Run workflow" with
environment=production**. Crawlers on `/item/<id>` get OG tags built from Supabase REST with the
anon key; other crawler requests are proxied from the app; browsers get a 302 to the app origin
(`/item/<id>` → `/feed?post=<id>`, everything else to the same path).
Unit tests: `bunx vitest run workers`. Hostnames are attached as **routes** in the dashboard (the
Custom Domain dialog couldn't find the zones), on a proxied `AAAA <name> 100::` placeholder
record; CI deploys leave dashboard routes alone. Traps hit while building it:

- **Facebook fetches with `meta-externalagent` / `meta-externalfetcher`**, not only
  `facebookexternalhit`. Miss them and Facebook posts show the generic card.
- **No `<meta http-equiv="refresh">` in the crawler page** — Facebook follows it and scrapes the
  app's generic tags instead.
- **Don't route crawlers to a Supabase edge function for HTML.** `*.supabase.co` serves function
  HTML as `text/plain` with a sandbox CSP, which crawlers ignore. That's why the old `og-preview`
  function + `pif-og-preview` Worker never worked.
- **Proxying a hostname wakes up dormant Cloudflare config.** While `app.pif.community` was
  DNS-only (Hado), Cloudflare never saw its traffic; flipping it to proxied activated a forgotten
  zone Redirect Rule (`/item/*` → `og-preview`, now disabled) and the old Worker's more specific
  `app.pif.community/item/*` route (deleted) — rules run before Workers, and the most specific
  route wins. Item links broke for ~5 minutes. **Before proxying any hostname, list the zone's
  Rules (Redirect/Page/Bulk) and every Worker's routes.**
- Facebook caches previews: after a fix, re-scrape in the Sharing Debugger
  (developers.facebook.com/tools/debug). Encrypted Messenger chats show no preview for any link
  (the sender's device fetches it) — not a bug.

## Staging environment (Supabase branch + Cloudflare Pages)

A parallel staging pipeline exists so changes can be tested before touching production. Pieces:

- **Which Supabase project a build talks to is an env var, not code** (since 2026-10-27).
  `src/integrations/supabase/config.ts` reads `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`
  and **defaults to production** when neither is set (setting only one throws); `client.ts` and
  `scripts/generate-sitemap.ts` both use it, so `main` and `staging` carry identical code. The
  flip side: **any build that doesn't set the variables talks to the production database.** Never
  add a build path for staging (or a preview) that doesn't set them — that's exactly what Lovable's
  editor preview did with a `.env.production`-only pin, and Lovable flagged it.
- **Staging = `https://staging.pif.today`** (Cloudflare Pages project `pif-staging`, also
  `pif-staging.pages.dev`), deployed by `.github/workflows/deploy-staging.yml` on every push to
  `staging` in the `pif` repo: typecheck → build the exact commit with the staging
  `VITE_SUPABASE_*` set in the workflow → **guard step that refuses to deploy unless the bundle
  references the staging project** → `bunx wrangler pages deploy` (not `cloudflare/wrangler-action`,
  which npm-installs wrangler and dies on the app's `date-fns` peer deps). All three deploy
  workflows share the `pif` repo's secrets `CLOUDFLARE_API_TOKEN` (Account → Cloudflare Pages → Edit
  + Account → Workers Scripts → Edit, no DNS/zone permissions — dashboard changes are the user's)
  and `CLOUDFLARE_ACCOUNT_ID`; set them with `pbpaste | gh secret set NAME -R ...`
  (a `!`-prefixed `gh secret set NAME` has no TTY and silently stores an empty value). Verify a
  deploy with `gh run list -R fredriklichtenstein-netizen/pif` and
  `curl https://staging.pif.today/version.json` — no Lovable sync dance needed.
- **The Supabase branch ref is `epxqddygoarwxmbshvvx`, and it changes every time the branch is
  deleted/recreated** (Supabase assigns a new one each time). When that happens, update the URL/key
  in the workflow's Build step and the ref in its guard step, plus staging's `site_url`/allow-list.
- **One GitHub repo** (`fredriklichtenstein-netizen/pif`, branches `main` and `staging`, which share
  no history — always cherry-pick explicit SHAs). Until 2026-10-27 staging lived in a second repo,
  `pif-staging`, created by a Lovable remix; it's archived. Both Lovable projects were deleted and
  their `*.lovable.app` URLs removed from Mapbox, the auth allow-list and DNS (H6).
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
- **Promotion workflow**: implement on `staging`, user tests on `staging.pif.today`, confirm, then
  cherry-pick (never a full `git merge`) the relevant commits onto `main` — the code no longer
  diverges per environment, but cherry-picking keeps unreviewed staging experiments and CI noise
  off `main`. **Pushing `main` to `origin` deploys production** (since 2026-10-27, H5):
  `.github/workflows/deploy-production.yml` in the `pif` repo typechecks, builds with no
  `VITE_SUPABASE_*` (= production), runs a guard that refuses to deploy if the bundle lacks the
  production ref or contains the staging ref / `share-staging.pif.today`, and runs
  `bunx wrangler pages deploy` to Cloudflare Pages project `pif` (`pif-333.pages.dev` — `pif.pages.dev`
  belonged to someone else — with custom domains `pif.today` + `www.pif.today`). It also runs daily
  (03:17 UTC) so `public/sitemap.xml` picks up new items. Its secrets live in the `pif` repo (a
  separate token from staging's, Account → Cloudflare Pages → Edit only). Once the user has
  confirmed a fix on staging, pushing `main` is pre-authorized. Verify with
  `gh run list -R fredriklichtenstein-netizen/pif` and `curl https://pif.today/version.json`, plus a
  bundle marker for specific changes (verify-deploy skill). Any new DB migration gets promoted
  separately, directly via `mcp__claude_ai_Supabase__execute_sql`/`apply_migration` against the
  production project ID. Rollback: re-run an older green run, or `git revert` + push.
- **Lovable history (production was published via Lovable until 2026-10-27).** Both Lovable
  projects were disconnected from GitHub and deleted on 2026-10-27 (H6). Lessons from that era, in case Lovable is ever used again: its
  agent keeps an internal editor branch that only syncs with GitHub when invoked via chat, so
  `deploy_project`/"Publish" could ship stale code while `latest_commit_sha` looked right; the agent
  ignored "make no code changes" instructions and pushed unrequested edits; and its 6am auto-fix
  job pushed straight to `main`. Only fetching the live bundle ever proved what was deployed.
- **`supabase/migrations/` in the repo is not a complete record.** Most migrations are applied
  straight to production via `apply_migration` and never committed (~70 live vs a handful of files).
  The authoritative history is `supabase_migrations.schema_migrations` on production. The four
  migrations from 2026-09-26 → 10-01 were back-filled into the repo on 2026-10-25; if more have
  accumulated since, compare `list_migrations` against the folder before relying on it.
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
  (adding `example.com` also covers `anything.example.com`), so the allowed list is just root
  domains: `pif.today`, `app.pif.community`, plus (2026-10-27) `staging.pif.today` and
  `pif-staging.pages.dev` (which also covers per-deploy `<hash>.pif-staging.pages.dev` previews)
  and `pif-333.pages.dev` (production's Pages project). The Lovable URLs were removed in H6.
  Never add a shared parent domain (e.g. `pages.dev`) — it would authorize everyone's sites. Set via `supabase secrets set MAPBOX_TOKEN=... --project-ref <ref>` on both
  projects — the `get-mapbox-token` edge function picks up a changed secret immediately, no
  redeploy needed.

## Git / deployment workflow

- Production deploys from `main` via GitHub Actions → Cloudflare Pages (see Promotion workflow).
  Lovable still has two-way GitHub sync with this repo until H6 but is no longer used to publish.
  Do not rely on Lovable to write code — it has reconstructed code/SQL from stale internal state
  before, causing real bugs.
- Repo: `fredriklichtenstein-netizen/pif`. Push access from a cloud/web Claude Code session may be
  blocked (proxy/GitHub App write scope issue, unresolved as of this writing) — a local Claude Code
  session authenticated via `gh auth login` has confirmed working push access instead.
- For anything touching layout/rendering (especially Map), confirm via description or screenshot
  that it still works before considering a task done.
