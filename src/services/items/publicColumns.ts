/**
 * The columns of `items` that may be read for ANY item, including other people's
 * and including while logged out.
 *
 * This exists because `select('*')` was how PIF leaked, for every live listing,
 * the owner's exact coordinates, street address, pickup door code, phone number
 * and pickup instructions — to unauthenticated callers. Postgres now enforces
 * this at the grant level (role `anon` holds a column allowlist rather than a
 * table-wide SELECT), so a query asking for more than this fails outright with
 * 42501 rather than quietly succeeding.
 *
 * RULES:
 *  - NEVER add `coordinates_json`, `location`, `pickup_address`,
 *    `pickup_door_code`, `pickup_floor`, `pickup_instructions` or `phone` here.
 *    `location` in particular is not a city label — it holds the full geocoded
 *    address ("Kristinebergs Slottsväg 1, 112 14 Stockholm, Sweden").
 *  - Read `coordinates_public` (deterministically offset 150–500 m, server-side)
 *    and `location_public` (locality only) instead.
 *  - An owner, or a receiver whose interest is `status='selected'`, gets the
 *    exact values via the `get_item_private_location` RPC — never via a table
 *    select. See fetchItemPrivateLocation() below.
 *  - NEVER go back to `select('*')` on this table.
 */
export const ITEM_PUBLIC_COLUMNS = [
  "id",
  "user_id",
  "title",
  "description",
  "category",
  "condition",
  "item_type",
  "pif_status",
  "images",
  "measurements",
  "archived_at",
  "archived_reason",
  "created_at",
  "pickup_preference",
  "preferred_time_window",
  "piffer_confirmed_handoff",
  "receiver_confirmed_receipt",
  "piffer_overruled",
  "completed_at",
  "image_crops",
  "visibility_radius_km",
  "stale_reminder_stage",
  "stale_reminder_clock_start",
  "coordinates_public",
  "location_public",
].join(", ");

/** The profile embed the feed and item views use alongside the item columns. */
export const ITEM_OWNER_PROFILE_EMBED =
  "profiles!items_user_id_fkey(id, first_name, last_name, username, avatar_url)";

export const ITEM_PUBLIC_SELECT = `${ITEM_PUBLIC_COLUMNS}, ${ITEM_OWNER_PROFILE_EMBED}`;
