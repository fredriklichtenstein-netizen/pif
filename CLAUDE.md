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

Verified current list (`supabase/functions/`): `analyze-image`, `delete-account`, `prewarm-og`,
`send-report`, `send-feedback`, `get-mapbox-token`. Deployment to Supabase is a distinct step from
writing the code — always deploy after editing.

## Git / deployment workflow

- Lovable has two-way GitHub sync with this repo and is used only for its "Publish" button to push
  the repo's current state live. Do not rely on Lovable to write code — it has reconstructed code/SQL
  from stale internal state before, causing real bugs.
- Repo: `fredriklichtenstein-netizen/pif`. Push access from a cloud/web Claude Code session may be
  blocked (proxy/GitHub App write scope issue, unresolved as of this writing) — a local Claude Code
  session authenticated via `gh auth login` has confirmed working push access instead.
- For anything touching layout/rendering (especially Map), confirm via description or screenshot
  that it still works before considering a task done.
