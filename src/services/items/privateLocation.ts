import { supabase } from "@/integrations/supabase/client";

export interface ItemPrivateLocation {
  /** Exact coordinate, as stored. Null when the item has none. */
  coordinates: { lat: number; lng: number } | null;
  /** Full geocoded address — NOT a city label. */
  location: string | null;
  pickupAddress: string | null;
  pickupDoorCode: string | null;
  pickupFloor: string | null;
  pickupInstructions: string | null;
  phone: string | null;
  isOwner: boolean;
}

/**
 * Fetch an item's exact location and pickup details.
 *
 * The database releases these only to the item's owner, or to a receiver whose
 * interest on that item is `status='selected'` — they need the address, door
 * code and instructions to actually collect it. Everyone else, including users
 * who have merely registered interest, is refused with 42501.
 *
 * There is deliberately no table-select route to these values: role `anon` holds
 * no grant on the underlying columns, so this RPC is the single audited doorway.
 * Callers must treat `null` as the ordinary outcome, not a failure.
 */
export async function fetchItemPrivateLocation(
  itemId: number | string
): Promise<ItemPrivateLocation | null> {
  const numericId = typeof itemId === "string" ? parseInt(itemId, 10) : itemId;
  if (!Number.isFinite(numericId)) return null;

  const { data, error } = await supabase
    .rpc("get_item_private_location", { p_item_id: numericId })
    .maybeSingle();

  if (error) {
    // 42501 is the expected result for anyone not entitled to these values, so
    // it is not worth surfacing as a failure.
    if (error.code !== "42501") {
      console.error("Could not load private item location:", error);
    }
    return null;
  }
  if (!data) return null;

  const row = data as any;
  const lat = Number(row.coordinates_json?.lat);
  const lng = Number(row.coordinates_json?.lng);

  return {
    coordinates:
      Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
    location: row.location ?? null,
    pickupAddress: row.pickup_address ?? null,
    pickupDoorCode: row.pickup_door_code ?? null,
    pickupFloor: row.pickup_floor != null ? String(row.pickup_floor) : null,
    pickupInstructions: row.pickup_instructions ?? null,
    phone: row.phone ?? null,
    isOwner: Boolean(row.is_owner),
  };
}
