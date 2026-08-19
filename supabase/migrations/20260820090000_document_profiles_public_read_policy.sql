-- The "Public read" policy on profiles is USING (true) — every row, not just
-- the caller's own — and that's intentional: queries.ts and
-- useCachedProfile.ts both fetch OTHER users' rows by id (feed/profile
-- avatars), which only works because this policy has no row restriction.
-- Narrowing it to auth.uid() would break that.
--
-- The actual security boundary is the column-level SELECT grant on
-- authenticated/anon (see src/services/profile/publicColumns.ts), which
-- limits requests to the safe public columns and fails closed with 42501
-- for anything else — it does NOT come from this policy. Renaming +
-- commenting so that's visible at the schema level, not only in app-code
-- comments: a future column grant on a private field (address, phone,
-- pickup_*, location_json, date_of_birth, notification_preferences) would
-- immediately expose it for every row via this same policy.

ALTER POLICY "Public read" ON public.profiles
  RENAME TO "Public read (grant-restricted, see publicColumns.ts)";

COMMENT ON POLICY "Public read (grant-restricted, see publicColumns.ts)" ON public.profiles IS
  'USING (true) is intentional — other users'' rows must be readable for feed/profile display (queries.ts, useCachedProfile.ts fetch by arbitrary id). This policy provides NO column protection. Private columns (address, phone, pickup_*, location_json, date_of_birth, notification_preferences) stay hidden only because authenticated/anon lack column-level SELECT on them (see src/services/profile/publicColumns.ts). Granting SELECT on a private column to authenticated/anon exposes it for every row through this policy — the column grant is the real boundary, not this policy.';
