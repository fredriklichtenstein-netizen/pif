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
 *  - `last_name` is a further split within this already-public set: the
 *    `anon` role's grant on it was revoked (only-first-names-when-logged-out),
 *    so it's appended only when isAuthenticated is true. A query that asks
 *    for it anonymously fails outright with 42501, same enforcement style as
 *    the rest of this file.
 */
const PROFILE_PUBLIC_COLUMNS_BASE = [
  "id",
  "username",
  "first_name",
  "avatar_url",
  "created_at",
  "city",
  "coordinates_public",
  "reliability_score",
  "completed_pifs",
  "no_shows",
  "onboarding_completed",
].join(", ");

export function getProfilePublicColumns(isAuthenticated: boolean): string {
  return isAuthenticated
    ? `${PROFILE_PUBLIC_COLUMNS_BASE}, last_name`
    : PROFILE_PUBLIC_COLUMNS_BASE;
}

/**
 * For the recurring `profiles:some_fk(id, first_name, last_name, avatar_url,
 * ...)` embed shape used when joining a comment/like/interest row to its
 * author's profile (as opposed to an item's owner, which has its own
 * getItemOwnerProfileEmbed). Same last_name gating, just built inline since
 * each call site's extra columns (username, reliability_score, ...) differ.
 */
export function getProfileEmbedColumns(
  isAuthenticated: boolean,
  extraColumns: string[] = [],
): string {
  return [
    "id",
    "first_name",
    ...(isAuthenticated ? ["last_name"] : []),
    "avatar_url",
    ...extraColumns,
  ].join(", ");
}
