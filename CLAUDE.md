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

## Mapbox

Mapbox GL JS requires a DEFINITE (not min-height) container height at initialization. `min-h-screen-dvh` /
`flex-1` chains can resolve to 0px and break map rendering entirely — this has happened twice. Any
change near the Map page's layout must be tested on a real device before considering it done.

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
  `mcp__claude_ai_Supabase__execute_sql`/`apply_migration` against the production project ID.
- **Mapbox token**: currently the account's unrestricted default public token. Mapbox recommends
  a URL-restricted token instead (dashboard → Tokens → Create token → restrict to
  `app.pif.community`, `pif.today`, and the Lovable preview domains) — flagged, not yet done.

## Git / deployment workflow

- Lovable has two-way GitHub sync with this repo and is used only for its "Publish" button to push
  the repo's current state live. Do not rely on Lovable to write code — it has reconstructed code/SQL
  from stale internal state before, causing real bugs.
- Repo: `fredriklichtenstein-netizen/pif`. Push access from a cloud/web Claude Code session may be
  blocked (proxy/GitHub App write scope issue, unresolved as of this writing) — a local Claude Code
  session authenticated via `gh auth login` has confirmed working push access instead.
- For anything touching layout/rendering (especially Map), confirm via description or screenshot
  that it still works before considering a task done.
