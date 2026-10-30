import type { PostFormData } from "@/types/post";

/**
 * Maps post-form state to the item columns shared by `items` and
 * `item_drafts`. Used by both the publish path and draft saving so a draft
 * publishes exactly what the form would have.
 */
export function buildItemFields(formData: PostFormData) {
  let coordinatesJson: { lng: number; lat: number } | null = null;
  if (formData.coordinates && formData.coordinates.lat !== null && formData.coordinates.lng !== null) {
    coordinatesJson = {
      lng: formData.coordinates.lng,
      lat: formData.coordinates.lat,
    };
  }

  return {
    title: formData.title,
    description: formData.description,
    category: formData.category,
    condition: formData.condition,
    item_type: formData.item_type,
    coordinates_json: coordinatesJson,
    location: formData.location,
    images: formData.images,
    image_crops: formData.imageCrops || [],
    measurements: formData.measurements,
    visibility_radius_km: formData.visibilityRadiusKm ?? null,
    // Defensive guard: only forward values the DB check constraint accepts
    // (meetup | leave_at_door | flexible). Anything else — including legacy
    // in-flight form state — is coerced to NULL so the insert/update never
    // fails on items_pickup_preference_check.
    pickup_preference: (['meetup', 'leave_at_door', 'flexible'] as const).includes(
      formData.pickup_preference as any,
    )
      ? (formData.pickup_preference as 'meetup' | 'leave_at_door' | 'flexible')
      : null,
    can_meet_elsewhere: !!formData.can_meet_elsewhere,
    pickup_door_code: formData.pickup_door_code?.trim() || null,
    pickup_floor: formData.pickup_floor && formData.pickup_floor.trim() !== ''
      ? parseInt(formData.pickup_floor, 10)
      : null,
    pickup_instructions: formData.pickup_instructions?.trim() || null,
    preferred_time_window: formData.preferred_time_window?.trim() || null,
    pickup_address: formData.pickup_address?.trim() || null,
    phone: formData.phone?.trim() || null,
  };
}
