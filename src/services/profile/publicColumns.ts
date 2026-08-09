/**
 * The columns of `profiles` readable for ANY user — including other people's
 * profiles and while logged out.
 *
 * This exists because `select('*')` on profiles was how PIF exposed, to
 * unauthenticated callers, 105 home addresses, 105 exact home coordinates and
 * 50 phone numbers. Postgres enforces the boundary at the grant level, so a
 * query asking for more than this fails with 42501 rather than quietly
 * succeeding.
 *
 * RULES:
 *  - NEVER add `address`, `location_json`, `phone`, `pickup_address`,
 *    `pickup_door_code`, `pickup_floor`, `pickup_instructions`,
 *    `date_of_birth` or `notification_preferences` here.
 *  - For someone's rough whereabouts use `coordinates_public` (deterministically
 *    offset 150–500 m, server-side) and `city` — never `location_json`.
 *  - To read YOUR OWN full profile, call fetchMyProfile() (the get_my_profile
 *    RPC). Column grants are not row-aware, so a table select cannot return your
 *    own private columns either.
 *  - NEVER go back to `select('*')` on this table.
 */
export const PROFILE_PUBLIC_COLUMNS = [
  "id",
  "username",
  "first_name",
  "last_name",
  "avatar_url",
  "created_at",
  "city",
  "coordinates_public",
  "reliability_score",
  "completed_pifs",
  "no_shows",
  "onboarding_completed",
].join(", ");
