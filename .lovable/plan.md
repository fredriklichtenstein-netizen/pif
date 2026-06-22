## Confirmation: no Realtime dependency on `profiles.location`

Only two subscriptions exist on the `profiles` table:

1. **`src/hooks/profile/useProfileAvatar.ts`** — reads `payload.new.avatar_url` only.
2. **`src/hooks/profile/useCachedProfile.ts`** — generic diff/merge of changed fields into the local profile cache. It iterates whatever keys arrive in `payload.new`; if `location` is absent the cache simply isn't updated for that field via Realtime, and the next REST fetch (`refresh()` / TTL revalidation) repopulates it.

No code path reads `profiles.location` from a Realtime payload to drive map pins, profile maps, geocoding, or anything else. Profile location consumers (`FeedProfileHeader`, `ProfileBasicInfo` → `ProfileLocationMap`, `useProfileFetch`, `useCityBackfill`) all fetch via REST `select`. So excluding `location` from the realtime publication is safe.

## Plan

Create a new migration that mirrors `items_realtime_exclude_coordinates.sql` for the `profiles` table:

**File:** `db/manual_migrations/profiles_realtime_exclude_location.sql`

Steps inside the migration:
1. `ALTER TABLE public.profiles REPLICA IDENTITY DEFAULT;` — so UPDATE.old contains only the primary key, never the raw `location` point.
2. Build a comma-separated column list of every `public.profiles` column **except `location`**, ordered by `ordinal_position`, via `information_schema.columns`.
3. If `public.profiles` is already a member of the `supabase_realtime` publication, `ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles`.
4. `ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles (<column-list>)` so future broadcasts never include `location`.

No application code changes are required. The user will apply the migration manually in the Supabase SQL editor, as with the items one.

### Expected outcome
- Realtime UPDATE payloads for `profiles` no longer carry the unparseable `(lng,lat)` point string.
- The "Unexpected token '('" JSON parse error disappears.
- `useCachedProfile` keeps working — it merges whatever fields arrive; `location` updates flow through normal REST refresh.
- `useProfileAvatar` is unaffected (it only reads `avatar_url`).
