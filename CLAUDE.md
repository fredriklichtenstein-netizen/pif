# PIF (Pay It Forward)

Swedish-language neighborhood item-sharing PWA. Live at pif.today / app.pif.community.
MVP just launched with real users — treat all changes with production-appropriate caution.
No experimental changes to auth, payments-adjacent flows, or data deletion without explicit confirmation.

**Hard rule: never show or expose anyone's exact address to other users.** Profiles and posts
only ever show the area (`profiles.city`, `items.location_public`) and the offset point
(`coordinates_public`, 150–500 m from the real spot). Never `location`, `location_json`,
`coordinates_json`, `pickup_address`, door code, floor, phone or pickup instructions. The database
enforces it with column-level grants; don't grant those columns, and don't return them from a
SECURITY DEFINER function. The only exception is the selected receiver's own pickup details via
`get_item_private_location`.

## Stack

- Frontend: React + TypeScript, Vite. Both environments deploy via GitHub Actions → Cloudflare
  Pages (production since 2026-10-27; see "Staging environment" → Promotion workflow). Lovable is
  no longer in the publish path; retiring it fully is H6 of the "Replace Lovable publishing" epic.
- Backend: Supabase, production domains pif.today / app.pif.community
- Maps: Mapbox GL JS
- Email: Resend (custom SMTP for Supabase Auth, plus transactional emails via Edge Functions)
- Mobile: Capacitor 8 native iOS/Android apps are being built (Trello G3) — see "Native apps".
- i18n: react-i18next, Swedish + English (`src/locales/{sv,en}/*.json`)
- Analytics: Cloudflare Web Analytics (cookieless), enabled on the `pif` Pages project only — Pages
  injects the beacon into HTML on deploy, so there's no code for it. The privacy policy
  (`src/pages/Privacy.tsx`, section 3 + 6) describes it; keep the two in step if this changes.
- Sign in with Google (since 2026-11): Google Identity Services button + `signInWithIdToken`
  (`src/components/auth/GoogleSignInButton.tsx`), **not** `signInWithOAuth` — a redirect makes an
  installed iOS PWA finish the sign-in in Safari, whose storage is separate. One OAuth client
  (Google Cloud project pif-community) serves staging and production; its *Authorized JavaScript
  origins* must list every app origin, or the button fails with an origin error. Google-only
  accounts have no password (`has_password()` RPC); Settings offers "Skapa lösenord" via the
  recovery link. Privacy policy sections 1, 3 and 6 describe it.
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
- **`items` is readable column by column**: `anon` and `authenticated` hold a column-level SELECT
  allowlist, not a table grant (see `src/services/items/publicColumns.ts`). **A new column on
  `items` is unreadable until the migration adds `GRANT SELECT (<col>) ON public.items TO anon,
  authenticated`.** If a query selects, filters or orders by it before then, it fails with 42501
  and the feed breaks. `is_inactive` (generated: archived or completed) is what the feed orders
  by: active first.
- **`interests` is readable column by column too** (since 2026-11-27, migrations
  `20261127090000_interests_private_rpcs` + `20261127090100_interests_column_grants`): clients may
  SELECT `id, item_id, user_id, created_at, status, selected_at, item_type` only. `note`,
  `receiver_rating`, `rating_comment`, `owner_rating`, `owner_rating_comment` are read through
  `get_interest_notes()` (post owner + the note's writer), `has_rated_handover()` and
  `get_pending_ratings()`. `select('*')` on interests (also embedded, `interests(*)`) fails; a new
  column needs its own `GRANT SELECT (<col>)` if clients should read it. Before this, anyone could
  read every rating, rating comment and wish note via REST.
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
`send-report`, `send-feedback`, `get-mapbox-token`, `send-notification-email`, `purge-draft-images`, `send-push` (verify_jwt off). Deployment to Supabase is a distinct step from
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

**Stale posts** (`_process_stale_items()`, cron `process-stale-items` 06:00 UTC; since 2026-11-22,
migration `20261122140000_stale_items_selected_receiver`): reminders at 7/14/21/28 days and
auto-archive at 30 only for posts with **nobody chosen**. A pif whose giver confirmed the handover
is marked `completed` at 30 days even if the receiver never confirmed; a post with a chosen
receiver/helper is never archived and keeps a weekly "confirm" reminder up to 8 weeks. The
in-app/push title is worded per situation (like the email's `STALE_CTA_COPY`), and the email's
"arkiveras efter 30 dagar" line only shows for `no_interest` / `select_receiver` / `select_fulfiller`.

Feedback screenshots: html2canvas copies a WebGL canvas (Mapbox) as blank unless it was created
with `preserveDrawingBuffer: true` — all three maps set it; keep it on any new map.

**Drafts & scheduled posts** live in `item_drafts` (owner-only RLS), never in `items` — `items`
is public-read and every "active" filter would leak a new status. `publish_draft()` copies a draft
into `items` (created_at/stale clock = publish time) and deletes it; cron
`publish-scheduled-drafts` (*/5) does the same for due drafts and notifies (prefs
`push_scheduled_published` / `email_scheduled_published`, opt-out); `cleanup-stale-drafts`
(daily) deletes unscheduled drafts untouched for 90 days. Promoted 2026-10-30; production recorded
the two migrations as `20261030122618` (drafts) / `20261030122619` (own-folder storage policies) —
the repo files carry staging's versions. Account deletion covers drafts via the
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

**Feature announcements** (since 2026-11-05): one `feature_announcements` row per feature. Rows
with the same `published_at` are one batch: one popup carousel (ordered by `id`) and **one** email
listing every feature. `trg_notify_feature_announcement` fires AFTER INSERT for each row, so the
broadcast skips every row except the batch's lowest `id`. Insert a batch in one statement with one
shared timestamp. Each line of a body (`\n`) renders as its own paragraph in both popup and email.
`[text](/path)` in a body is an in-app link in both (app paths only). Optional `image_url_sv`/`_en`
(https, ~960px-wide 2x PNG under `public/announcements/<date>/`) shows under the feature in the email
only. The email has one button (the first row with `action_url`). To send at a set time, use a one-off
pg_cron job that does the INSERT and then unschedules itself (the INSERT is the send).
Traps:
- The INSERT is what emails everyone. There's no "publish later": a NULL `published_at` matches no
  batch, so its broadcast errors out and sends nothing, and setting `published_at` later
  (an UPDATE) never sends one.
- To change or add rows without emailing anyone (e.g. #7 was split into 7/8/9 on 2026-11-05, with
  #7's timestamp so people who'd dismissed it didn't see it again), wrap the INSERT in
  `ALTER TABLE ... DISABLE TRIGGER trg_notify_feature_announcement` / `ENABLE TRIGGER` in the same
  DO block, then check `tgenabled = 'O'`.

## Newsletter ("Nyhetsbrev / Newsletter", since 2026-11-13)

Resend broadcasts, one per language. Never call it "weekly" or name a weekday in copy or UI.
- **Lists:** one Resend topic, *Nyhetsbrev / Newsletter* (default opt_in = everyone on it unless
  they opt out), and two segments, *Nyhetsbrev – svenska* / *– English*. Staging has its own
  `[Staging]` copies. Staging and production share **one Resend account with one contact per
  email**, so staging never deletes contacts or writes properties. IDs live in
  `supabase/functions/newsletter-sync/index.ts` (`LISTS`).
- **Sync** (`newsletter-sync`, verify_jwt off): triggers on `profiles` (name, language,
  `notification_preferences.email_newsletter`) and `auth.users` (email confirmed or changed,
  delete) enqueue pg_net calls. They're off unless vault secret `newsletter_sync_function_url`
  exists, and they swallow errors so auth can't break. Unconfirmed addresses are skipped. A deleted
  account's contact is deleted. Contact property `source` (`app`/`external`) is set once and never
  overwritten. Resend returns properties as `{value, type}`.
- **Opt-out path:** Settings switch → topic opt_out. Resend's unsubscribe page → webhook
  (`contact.topics.updated` + `contact.updated`, Svix-signed, `RESEND_WEBHOOK_SECRET`) →
  `_newsletter_set_preference()`, which writes only on change, so there's no echo loop.
  **Broadcasts must carry `topic_id`, or topic opt-outs still get the email.** The Resend MCP's
  create-broadcast has no topic field, so create them through the function's `create_broadcast`
  mode.
- **Keys:** contacts need a **full-access** Resend key. The app's send-only keys get
  `401 restricted_api_key`. Secret `RESEND_NEWSLETTER_API_KEY` (staging) /
  `RESEND_NEWSLETTER_API_KEY_MAIN` (production). The topics PATCH body is a bare array.
- **Issues:** `newsletter/issues/<date>.json` → `bun scripts/newsletter.ts <file>` →
  `newsletter/out/*.{sv,en}.{html,txt}` (gitignored). Photos are the Worker's `/og/<id>.webp`.
  Sender `PIF <hej@news.pif.today>` (since 2026-11-13), reply-to hej@pif.community. news.pif.today
  is its own Resend domain with open and click tracking on (links via `links.news.pif.today`).
  pif.today stays untracked: tracking is per domain, so it would also hit auth and notification
  mail, and a tracked domain doesn't route through Resend Forge. The privacy policy (section 6)
  says the newsletter is measured. Like pif.today, news.pif.today has no MX, so it can't receive.
- **External sign-ups** (107 from the old Wix site's form, CSV, signed up 2022-12 → 2026-01)
  were imported 2026-11-21: 96 new contacts (76 sv / 20 en, language from "Språkval" before
  "Språk"), `source` = `external`, in the language segments **and** in two welcome segments,
  *Välkomst externa – svenska* (`1cfafaff-…`) / *– English* (`08ee921d-…`). The other 11 were
  already contacts (app users) and were left alone, so they got no welcome. The welcome email
  (`newsletter/issues/2026-11-welcome-external.json`) went to the welcome segments only, as two
  broadcasts with `topic_id`, scheduled 2026-11-22 08:00 UTC. The CSV holds personal data and is
  not in the repo. Issue files may give a post `{ id, image }` to replace `/og/<id>.webp`: a photo
  narrower than 1200 px comes back from the Worker as a tall image (Supabase's render won't
  upscale), so use `/storage/v1/render/image/public/<path>?width=500&height=263&resize=cover`.
- **Language** is per device. `useLanguageSeed` writes the shown language to `profiles.language`
  each session, so emails match what the user sees.

## Weekly key figures email (since 2026-11-27, Trello #135)

- pg_cron `send-weekly-report` (Mondays 06:41 UTC) → `_send_weekly_report()` → one pg_net call
  (vault `notification_email_function_url` with the slug swapped, `x-internal-secret`) → edge
  function `weekly-report` (verify_jwt off) → `_weekly_report_stats(from, to)` for last week
  (Mon–Sun, Swedish time) and the week before → one email via Resend from
  `PIF <reports@pif.today>`, reply-to hej@pif.community. Migration `20261127170000_weekly_report`.
- Sections include newsletter and feature-email click-throughs (`nl-` / `fa-` touches) and how
  many have seen the latest feature popup (`last_seen_announcement_at`; a running total, so no
  week-before figure).
- **Counts only** — no names, emails or addresses — because a recipient is outside the
  organisation. Keep it that way when adding figures.
- Recipients: function secret `WEEKLY_REPORT_TO` (comma-separated); without it the function
  sends nothing (staging has none, so staging's Monday job is a no-op). A test send: POST with
  body `{"to": "<address>"}` sends only there (staging subjects get `[Staging]`).

## Campaign attribution (since 2026-11-22)

What people do in the app after clicking a newsletter link. Reported per campaign as counts only.
- **Links:** `scripts/newsletter.ts` adds `?ref=nl-<issue file name>` to every link into the app
  (logo, posts, button, text version). Feature-update emails (`send-notification-email`,
  broadcast mode) tag their app links `?ref=fa-<published_at date>` (since 2026-11-27, migration
  `20261127200000_feature_email_tracking`). Only `(nl|fa)-[a-z0-9-]{1,60}` is accepted anywhere.
- **App:** `src/components/analytics/CampaignTracker.tsx` (mounted in `App.tsx`) picks the tag up
  on any route (also in-app deep links), keeps it on the device for 30 days
  (`src/lib/campaignRef.ts`, latest click wins), removes it from the URL, and once signed in calls
  `record_campaign_touch(p_campaign, p_touched_at)`. That returns false until the profile exists
  (a new account is signed in before "Skapa profil"), so the tag is kept and retried.
- **DB** (migration `20261122010000_campaign_attribution`): `campaign_touches` and
  `campaign_events` (PK user + campaign + event), RLS on with no policies and no client grants.
  `signup` = account created after the click (5 min clock slack); triggers on `items` / `interests`
  / `likes` add `first_post` / `first_interest` / `first_save` for the latest touch within 30 days.
  Triggers swallow their own errors.
- **Report:** `bun scripts/campaign-report.ts` (production; `PROJECT=<ref>` for another): per
  campaign, and how many of the imported external sign-ups have an account and what they have done
  since the import. Uses the Management API + Resend API (proxy-injected in cloud sessions).
- **Privacy policy** section 6 describes it; section 2 says photos and titles of public posts may
  appear in the newsletter and on social media (never address or name). No separate opt-out:
  the right to object (section 5) covers it, and an objection must be honoured.

## Native apps (Capacitor, Trello G3 — decided 2026-11-15)

A shell around the same web bundle. It exists for three things the PWA can't do: push
notifications, email/share links that open the app on a phone (B13), and a store install path.
It is not a second product — no native-only features or UI.

- **App ID `community.pif.pif`** on both platforms (staging build: `community.pif.pif.staging`),
  display name "PIF". It is the bundle ID of the existing App Store record (Apple ID 6444768934,
  from an earlier build; categories Shopping / Social Networking), which we reuse rather than
  create a second app — so it cannot change. Apple team: PIF App AB, organization, Team ID
  `JZS9N2HAC8`, membership renews 2027-09-27.
- **Versions:** the old apps are iOS 1.1.9 ("Ready for Distribution" in App Store Connect) and
  Android 1.2.1 (versionCode 37). The new apps start at **2.0.0** on both; Android versionCode
  starts at 38 and only ever goes up.
- **Build for the native shells with `scripts/native-build.sh staging|production`** (build +
  database guard + `cap sync`). Use `staging` for all testing.
- **Links that leave the device use `appOrigin()`** (`src/lib/appOrigin.ts`): page origin on the
  web, `pif.today` / `staging.pif.today` in a native build. Used by sign-up and password reset.
- **Mapbox in the apps:** the web token's URL restriction can't match the app's origin (style
  load fails; seen in the simulator 2026-11-15). Native callers invoke `get-mapbox-token` with
  `{ platform: "native" }` (`src/lib/mapboxToken.ts`) and get secret `MAPBOX_TOKEN_NATIVE` — a
  separate public token with no URL restriction — or the web token if that secret is unset.
  Mapbox tokens: "PIF native apps" (URLs: 0) is the app token, "PIF production (restricted)"
  the web one. **A `curl` of the styles endpoint returns 200 for the restricted token even with
  the app's Origin/Referer — it proves nothing; only the map rendering in the app does.** On
  staging builds the map error names the refused request and the token's last six characters.
- **Edge to edge (decided 2026-11-16):** content runs behind the clock, as in the installed
  PWA; a white strip above the page is wrong. `StatusBar.overlaysWebView: true`, and
  `main.tsx` adds `native-app` to `<html>` in the apps. The "Native app shell" block at the end
  of `src/index.css` pads `body` by `env(safe-area-inset-top)` so pages start below the clock
  and scroll up behind it; `native-full-bleed` (the map) cancels that and fills the screen;
  `native-top-offset` keeps top-pinned things (toasts, offline badge, lightbox close) clear of
  the clock. Don't give the feed's sticky logo a `top` offset — it lands on top of the content. All of it is inert on the web.
- **Bottom nav** is a floating pill inset 22 px from the sides and
  `max(0.75rem, env(safe-area-inset-bottom) - 0.75rem)` from the bottom (22 px on phones with a
  home indicator), modelled on Instagram's bar at Fredrik's request (2026-11-16). Web and apps.
- `isStandalone()` is true in the native apps, so "add to home screen" hints never show there.
- **The map is full screen** (`.map-full-height` = `100dvh`, a definite height): it runs under
  the bottom nav and, in the apps, behind the clock. Mapbox's logo/scale and the zoom/locate
  stack are lifted (~90 px) so they stay above the nav.
- **App languages:** `Info.plist` declares `CFBundleLocalizations` sv + en. iOS picks the
  language of its own screens (camera, photo picker, share sheet) from that list; without `sv`
  they were English on a Swedish phone (seen 2026-11-19).
- **iOS permission texts** live in `ios/App/App/Info.plist` (`NS…UsageDescription`, Swedish /
  English in one string). Without the location one, `navigator.geolocation` in the app just
  spins and never asks; without the camera one, opening the camera crashes the app.
  `NSLocationAlwaysAndWhenInUseUsageDescription` is there only because Apple flags its absence
  (ITMS-90683) — the app never asks for "always".
- **Location in the apps** goes through `@capacitor/geolocation`: `src/native/geolocationBridge.ts`
  (installed in `main.tsx`, no-op on the web) replaces `navigator.geolocation.getCurrentPosition`
  and the geolocation `navigator.permissions.query`, so call sites stay plain browser code.
  Without it the web view prompts twice (app, then "localhost").
- **Sign-in in the apps** (`src/native/socialLogin.ts`, `NativeSignInButtons`, plugin
  `@capgo/capacitor-social-login` pinned to an exact version): the forms render native buttons
  instead of the web Google button when running natively. The system sheet returns an ID token,
  which goes to `supabase.auth.signInWithIdToken` with a hashed-nonce / raw-nonce pair like the
  web flow. Apple is offered on iOS only; Google on Android, and on iOS once
  `GOOGLE_IOS_CLIENT_ID` is set. Facebook/Twitter are compiled out (`capacitor.config.ts`).
  - Apple: entitlement `ios/App/App/App.entitlements`; Supabase Apple provider enabled with
    client id `community.pif.pif` (the bundle id; no secret needed for native ID tokens).
    Enabled on staging 2026-11-15 and on production 2026-11-19 (Fredrik's OK).
  - Google on iOS needs an OAuth client of type "iOS" (bundle id `community.pif.pif`) in Google
    Cloud project pif-community; its id goes in `GOOGLE_IOS_CLIENT_ID`, its reversed form as a
    URL scheme in `Info.plist`, and in Supabase's Google "additional client ids".
  - Privacy policy names Apple (sections 1 and 3; approved by Fredrik and live 2026-11-19).
    Still to do before release: Apple's
    private-relay email service must list our sending domain or mail to "Hide My Email"
    addresses bounces; account deletion should revoke the Apple token.
- The Xcode project carries `DEVELOPMENT_TEAM = JZS9N2HAC8`, so signing needs no manual step.
- **Xcode target/scheme is `PIF`** (renamed from Capacitor's `App` 2026-11-26; the product is
  `PIF.app`). The folder `ios/App` and `App.xcodeproj` keep Capacitor's names, which its CLI
  expects; `capacitor.config.ts` sets `ios.scheme: 'PIF'` for `cap run ios`.
- **Icons and splash** are generated from `assets/` with `bunx @capacitor/assets generate --ios
  --android` (then `git checkout android/app/src/main/AndroidManifest.xml` — the tool reformats
  it). The current source is the 512 px web icon upscaled; replace `assets/icon-only.png` with
  real 1024 px artwork before store submission.
- **Bundled, never a remote URL.** `capacitor.config.ts` must not get a `server.url` (offline
  failure, Apple 4.2). Consequence: inside the app the origin is `capacitor://localhost` (iOS) /
  `https://localhost` (Android), not `pif.today`. Anything keyed on origin needs handling: the
  URL-restricted Mapbox token, Google sign-in's authorized origins (and Google blocks sign-in in
  embedded web views anyway), and `window.location.origin` in `useSignUp` / `usePasswordReset`
  (would put a localhost link in emails).
- **Push is required for the public release**, not for the first TestFlight / Play internal builds.
- **Push (iOS; staging 2026-11-19, production 2026-11-20, first TestFlight push confirmed):** `src/native/push.ts` asks for permission after
  sign-in, registers with APNs and stores the token via `register_push_device()` (table
  `push_devices`, migration `20261119120000_push_notifications`); sign-out calls
  `unregister_push_device()` first. Triggers on `notifications` (every in-app notification, same
  text) and `messages` call `_trigger_push()`, which honours the `push_*` preferences and posts to
  edge function `send-push` (vault `push_function_url` + `x-internal-secret`). `send-push` talks to
  APNs with a .p8 key (secrets `APNS_KEY_P8`, `APNS_KEY_ID`); without them it returns
  `{skipped}`. Xcode builds get sandbox tokens, TestFlight/App Store production ones — it retries
  the other APNs host on `BadDeviceToken` and deletes dead tokens. Android needs Firebase first:
  never call `PushNotifications.register()` on Android without `google-services.json` (crash).
  The APNs key is "PIF APNs 2026" (Sandbox & Production, team scoped), same `.p8` on both projects;
  the 2023 key `SK7WG8KVQ6` had no surviving file and was revoked. Pushes show as a banner even
  with the app open (`presentationOptions`). Turning off iOS's own "Tillåt notiser" makes iOS hold
  pushes and show them when it's switched back on; the in-app switches stop them at the source.
  Notification switches in Settings save on flip (no save button). The feed refetches posts and
  active posts' counts when the app/tab returns after >=20 s (`src/lib/onAppResume.ts`), because
  realtime is paused while iOS has the app in the background.
- **Store releases only — no live-update service.** Installed apps keep running old web code until
  the user updates, so:
  - **DB and edge-function changes are additive first.** Never drop or rename an `items` column,
    change an RPC signature or change an edge function's request/response shape while a shipped
    build still uses it. Add the new thing, ship the app, remove the old thing only when old
    builds are gone.
  - **Minimum-version check (since 2026-11-24, staging; first shipped in build 4):**
    `public/app-version.json` (`{"ios":{"minBuild":N},"android":{"minBuild":N}}`, served
    `no-store` with CORS via `public/_headers`). `UpdateRequiredGate` (App.tsx) checks it at
    launch and on resume in the native apps and covers the app with "Uppdatering krävs" + a store
    link when the build number (iOS `CURRENT_PROJECT_VERSION` / Android `versionCode`) is below
    the minimum. Build numbers must only ever go up, across versions too. Offline, timeouts or a
    broken file never block (`src/native/minVersion.ts`). Production builds read
    `pif.today/app-version.json` (so raising it is a commit to `main`); staging builds read
    staging's copy. Builds 1–3 predate the check and can't be stopped by it.
- **App links (2026-11-16, staging):** `public/.well-known/apple-app-site-association` (app id
  `JZS9N2HAC8.community.pif.pif`, all paths) and `assetlinks.json` (Play signing key), served as
  JSON via `public/_headers`; iOS entitlement `applinks:pif.today` + `applinks:staging.pif.today`;
  Android `autoVerify` intent filter. `src/native/deepLinks.ts` (plugin `@capacitor/app`) turns an
  incoming link into an in-app navigation. iOS fetches the association file through Apple's CDN
  at install time and caches it — after changing the file, delete and reinstall the app, and
  expect up to a day's delay. `app.pif.community` share links are not associated yet (the Worker
  would have to serve the file itself).
- **Staging emails on a phone with the TestFlight (production) app:** both builds share the app
  ID, so iOS hands `staging.pif.today` links to the installed app; a production build ignores
  staging hosts and just stays on its current screen (seen 2026-11-20 with a staging password
  reset). Not a bug, and users never get staging mail. When testing staging on the phone,
  long-press the link → Öppna i Safari, or open it on the Mac. Decided not to build an in-app
  browser fallback for it (2026-11-22).
- **Link domain: `pif.today` is canonical** for Universal Links / App Links (`site_url` stays
  `https://pif.today`). `app.pif.community` is a secondary associated domain; the share Worker
  must then serve the two association files itself instead of redirecting. Staging app:
  `staging.pif.today`.
- **Store accounts: organization, as PIF App AB.** Apple exists (above). Google Play: an
  organization account ("PIF Community") exists with the old app "PIF Pay it Forward", package
  `community.pif.pif` — same ID as iOS, so the Android project matches. It was live in
  production: v1.2.1, versionCode 37, full rollout 2024-08-25 — so **new Android builds need
  versionCode ≥ 38 and a versionName above 1.2.1**, and must be signed with a key Play accepts
  for this package. The account is
  **restricted**: Google removed the profile and apps for failed/missed identity verification
  (2024-10-16, and again notified 2026-11-15 "Google couldn't verify your identity" after a
  resubmission). Nothing can be published on Android until that is resolved in the Play Console.
  **Play App Signing is on** ("Releases signed by Play"): Google holds the app signing key, so a
  lost upload key is not fatal — "Request reset" on the App signing page registers a new one.
  App signing key SHA-256 (what `assetlinks.json` needs):
  `C8:F6:5E:83:82:69:90:05:1A:29:6A:4A:01:07:DF:40:1D:60:53:AE:1F:B9:07:EF:F1:50:43:C8:12:E3:45:A4`.
  Console path: app → Protected with Play → Play Store protection → Manage Play app signing.
  The old upload key is lost (confirmed 2026-11-15): G3.3 creates a new upload keystore on the
  Mac and registers it via "Request reset". Keep the keystore and its password out of the repo
  and backed up.
- Capacitor packages are all on v8 (Node 22+). `cap add ios` and `cap add android` both run on
  Linux (iOS uses Swift Package Manager, no CocoaPods), but building, simulators and signing need
  a Mac with Xcode / Android Studio. `ios/` and `android/` are committed; the copied web bundle
  inside them is gitignored. On the Mac: `bun install`, `scripts/native-build.sh staging`, then
  `bunx cap open ios` / `bunx cap open android`. Re-run the script after every web or plugin
  change. Both are portrait-only on phones.
- **TestFlight (decided 2026-11-19):** TestFlight builds are the production build
  (`scripts/native-build.sh production` on `main`), uploaded from Xcode (Any iOS Device → Product
  → Archive → Distribute App → App Store Connect). No side-by-side staging app yet; staging builds
  go to a phone straight from Xcode and replace the TestFlight install (same app ID).
  **Without clicking (since 2026-11-24, build 3):** with Fredrik's Mac attached to a cloud session
  (Remote Control, folder `pif`), on `main`: bump `CURRENT_PROJECT_VERSION` in
  `ios/App/App.xcodeproj/project.pbxproj` (both configs) and push; then on the Mac
  `scripts/native-build.sh production`, `xcodebuild -project ios/App/App.xcodeproj -scheme PIF
  -configuration Release -destination 'generic/platform=iOS' -archivePath
  ~/pif-archives/PIF-<ver>-<build>.xcarchive -allowProvisioningUpdates archive`, then
  `xcodebuild -exportArchive ... -exportOptionsPlist ~/pif-archives/ExportOptions.plist
  -allowProvisioningUpdates` (method `app-store-connect`, destination `upload`, team
  `JZS9N2HAC8`, automatic signing, `manageAppVersionAndBuildNumber` false). Uses the Apple account
  signed in to Xcode; archives and logs stay in `~/pif-archives`, outside the repo. Before building,
  grep `ios/App/App/public/assets` for the production ref and that the staging ref is absent.
- Known gaps before store review: Android push (Firebase),
  real 1024 px icon artwork, Google sign-in on iOS (needs the iOS
  OAuth client id). Sign in with Apple is built and live.

## Pif and wish flows (audit 2026-11-27, Trello #141)

- **Wish handover is per helper** (migration `20261127150000_wish_per_helper_handover`):
  `interests.owner_confirmed_at` / `helper_confirmed_at` on each chosen helper's row,
  `confirm_wish_handoff(item, helper, 'owner'|'helper')` / `undo_wish_handoff`. Confirming never
  completes a wish; the wisher closes it with `complete_wish()` ("Stäng önskan", in the chat banner
  and the ⋯ dialog), which tells every chosen helper. Pifs keep the post-level flags
  (`items.piffer_confirmed_handoff` / `receiver_confirmed_receipt`) and complete when both confirm.
  `confirm_pif_handoff` / `undo_pif_handoff_confirmation` on a wish act on the caller's own row, or
  the only chosen helper; with several chosen helpers they refuse (installed app builds).
- **Withdrawing (decided 2026-11-27, migration `20261127120000_flow_consistency_round1`):** the
  owner deselecting puts the person back in the queue with their note; someone withdrawing
  themselves is removed — same for pifs and wishes. "Återpublicera" puts whoever was chosen back
  in the queue. Choosing refuses archived/completed posts and notifies the chosen person
  (`receiver_selected` / `helper_selected`, push too).

## Ratings (decided by Fredrik 2026-11-26)

- **The one who gives rates the one who receives, never the other way round.** Pif: the piffer
  rates the receiver (`interests.receiver_rating` / `rating_comment` on the receiver's row).
  Wish: the helper rates the wisher (`interests.owner_rating` / `owner_rating_comment` on the
  helper's own row). Wishers don't rate helpers; receivers don't rate piffers.
- Stars (`PifRatingModal`, modes `complete` / `rate` / `complete_no_rating`). Ratings saved after
  the post is done go through `rate_after_handover()`; `complete_pif_with_rating()` is only for
  "Markera som klar ändå" (it refuses a completed post) and takes `p_rating` null for a wish.
  Migration `20261126090000_wish_owner_rating`.
- **Who gets asked, and where:** the rater is asked in the chat whenever they open a completed
  post's chat, and app-wide by `RatingPrompt` (App.tsx) — both for posts completed in the last
  30 days that they haven't rated. "Hoppa över" is remembered per device (`src/lib/ratingSkip.ts`).
  Needed because the other side often completes the post while the rater is elsewhere, and the
  chat then sits under "Historik".
- The profile rating (`get_user_public_stats`) = receiver_rating on pifs + owner_rating on one's
  own wishes. The old `ratings` table ("Gick bra / Dök inte upp", `submit_rating`) has no UI left
  except the legacy `ReceiverConfirmation`; production had 0 rows.

## Terms of use (Apple 1.2; staging 2026-11-24)

- **Page:** `/villkor` (`src/pages/Terms.tsx`, sv + en; `/terms` redirects). Text approved by
  Fredrik 2026-11-24. `TERMS_VERSION` / `TERMS_EFFECTIVE_DATE` live in `src/lib/terms.ts`; bump the
  version for a material change and everyone sees the one-time screen again.
- **Stored on the account:** `profiles.terms_version` + `terms_accepted_at` (migration
  `20261124090000_terms_acceptance`). No SELECT grant: read via `get_my_terms_acceptance()`, written
  via `accept_terms(p_version)` (both SECURITY DEFINER, authenticated only).
- **New accounts** tick "Jag godkänner användarvillkoren och integritetspolicyn" on step 1 of
  "Skapa profil" (`TermsConsent`, texts open in a dialog — a new tab doesn't work in the native
  apps); `CreateProfile` calls `accept_terms` after `complete_onboarding`.
- **Everyone else** gets the one-time screen from `TermsGate` (mounted in `App.tsx`), once per
  session, "Jag godkänner" / "Inte nu". After "Inte nu" they can browse; `ensureTermsAccepted()`
  (`src/stores/termsStore.ts`) brings the screen back before a new post or draft publish, a new
  interest (checked before the wish/pif dialog opens), a comment or a message. Withdrawing interest
  and editing a post stay allowed. Status "unknown" (not loaded / lookup failed) never blocks.
- **Not yet:** the database-side block (BEFORE INSERT guards like `user_blocks`', plus scheduled
  drafts). Decided order: web first, then the native build with the screen, then the guard —
  installed app builds without the screen couldn't accept otherwise.

## Blocking and reports (Apple 1.2; staging 2026-11-20)

- **A block works both ways** (decided by Fredrik 2026-11-20): neither person sees the other's
  posts (feed + map) or comments, and neither can message, comment on the other's posts, reply to
  the other's comments or show interest. The blocked person is not told. Table `user_blocks`
  (owner-only RLS), RPCs `block_user` / `unblock_user` / `get_hidden_user_ids` (both directions,
  ids only) / `get_my_blocked_users`; migration `20261120120000_user_blocking`.
- **The database enforces it**: BEFORE INSERT guards on `messages`, `conversation_participants`,
  `comments`, `interests` raise `user_blocked`; `trg_skip_blocked_notification` drops any
  notification whose `payload.actor_id` is blocked with the recipient (so no push either), and
  `notify_comment_activity` skips blocked recipients because it emails directly.
- **App**: `src/stores/blockStore.ts` (hidden ids, loaded by `BlockUserDialogHost` in App, which
  also owns the one confirmation dialog — a dialog inside a dropdown unmounts with the menu).
  "Blockera" sits in the ⋯ menu of posts, comments, chat messages and the chat header, and on the
  profile sheet; Settings → Konto → "Blockerade användare" unblocks. A chat with a blocked person
  stays readable but has no input. An existing receiver selection is left alone (decision 2a);
  the giver can undo it.
- **Reports** go to **hej@pif.community** (since 2026-11-20; before that the address was
  hard-coded to Fredrik's personal Gmail). `send-report` also takes `reportedUserId` (column
  `reports.reported_user_id`), so a person can be reported from their profile sheet; after any
  report the app offers to block the person.
- **Moderation routine (Apple: act within 24 h):** hej@pif.community is checked daily. For each
  report: look at the post/comment/message (links in the email), remove content that breaks the
  rules (archive the post or delete the comment), and for serious or repeated cases delete the
  account. Note the outcome in a reply to the report email so there's a trail.

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
- **og:image is `/og/<id>.webp`, served by the Worker** (since 2026-11-04): a 1200×630 cover crop
  of the post's first Storage photo via Supabase's `/storage/v1/render/image/`, with
  `og:image:width/height` declared — without a landscape image of declared size, apps show the
  small side-by-side card. The render endpoint returns a ~1.3 MB PNG unless the request sends
  `Accept: image/webp` (`format=origin` doesn't help), so the Worker fetches it with that header.
  The crop is always centred. `?v=` is a hash of the photo URL, so a changed photo gets a new
  preview URL instead of a cached one.
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
- **Never cache `/assets/*` as immutable** (`public/_headers`). Cloudflare Pages answers a missing
  asset with `index.html` (200, `text/html`), so a browser that asks for a chunk mid-deploy stores
  HTML in its place; with `immutable, max-age=1y` every lazy page then shows "Kunde inte ladda
  sidan" until site data is cleared (hit 2026-11-20, `house-*.js`). Now `max-age=3600` (Cloudflare
  serves 4 h). Symptom in the console: `'text/html' is not a valid JavaScript MIME type`.
  Hit again 2026-11-24 (chunk *and* stylesheet → unstyled "Kunde inte ladda sidan"; a plain reload
  doesn't help). Since then the app repairs itself (`src/lib/assetRecovery.ts` + a boot guard in
  `index.html`): it refetches the page's `/assets/` files with `cache: "reload"` (overwrites the
  bad copy) and reloads, at most once a minute per file; "Försök igen" does the same. The CSS
  check tests `--background` from `index.css`, because an HTML page served as CSS still gets a
  `<link>.sheet`.
- **Testing on staging as a user (since 2026-11-27, Fredrik's OK):** two staging-only accounts,
  *Testare A* / *Testare B* (`hej+staging-testare-a|b@pif.community`, ids `ad0857e1-…` /
  `4313c67b-…`, profiles complete, terms accepted, every email/push notification off).
  `scripts/staging-test/login.sh a|b <outdir>` signs one into staging.pif.today in headless
  Chromium via a one-time login link and writes `<outdir>/state-<a|b>.json` (Playwright
  `storageState`); a test script then opens pages with `browser.newContext({ storageState })`.
  The service-role key is fetched from the Management API per run and never stored. Use
  `waitUntil: "domcontentloaded"` + a few seconds' wait (a signed-in page never goes network-idle).
  Test data goes on staging only, titled `[Test] …`. Never use this against production.
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
  needed — Management-API-based auth) separately. **On this machine `supabase secrets set` can exit
  silently without saving anything** (hit 2026-11-03) — set secrets with
  `POST /v1/projects/<ref>/secrets` (body `[{"name","value"}]`, value piped from `pbpaste`) and
  confirm with `GET .../secrets` (names only). Staging's `TRELLO_KEY`/`TRELLO_TOKEN` (same "PIF
  feedback form" Trello app as production, separate token) were set this way; staging feedback
  cards are titled `[Staging] …`. Direct Postgres connections (e.g. for
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
