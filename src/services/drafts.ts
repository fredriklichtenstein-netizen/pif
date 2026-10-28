import { supabase } from "@/integrations/supabase/client";
import type { PostFormData } from "@/types/post";
import { buildItemFields } from "@/services/items/itemFields";

/**
 * Drafts and scheduled posts live in `item_drafts` (owner-only RLS), never in
 * `items`, so nothing unpublished can reach the feed, map or share previews.
 * Publishing goes through the publish_draft RPC, which copies the row into
 * `items` and deletes the draft; scheduled drafts are published the same way
 * by the _publish_scheduled_drafts cron job.
 */

export interface ItemDraft {
  id: number;
  user_id: string;
  item_type: "offer" | "request";
  title: string | null;
  description: string | null;
  category: string | null;
  condition: string | null;
  images: string[];
  image_crops: any;
  location: string | null;
  coordinates_json: { lat: number; lng: number } | null;
  measurements: Record<string, string> | null;
  visibility_radius_km: number | null;
  pickup_preference: string | null;
  pickup_address: string | null;
  pickup_door_code: string | null;
  pickup_instructions: string | null;
  pickup_floor: number | null;
  preferred_time_window: string | null;
  phone: string | null;
  scheduled_at: string | null;
  publish_error: string | null;
  created_at: string;
  updated_at: string;
}

export const DRAFTS_QUERY_KEY = ["item-drafts"] as const;

/** Unscheduled drafts not edited for this many days are deleted daily. */
export const DRAFT_RETENTION_DAYS = 90;

// types.ts is a stub (Database = any), so the table is untyped here.
const drafts = () => (supabase as any).from("item_drafts");

export async function fetchMyDrafts(): Promise<ItemDraft[]> {
  const { data, error } = await drafts()
    .select("*")
    .order("scheduled_at", { ascending: true, nullsFirst: false })
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ItemDraft[];
}

export async function fetchDraft(id: number): Promise<ItemDraft | null> {
  const { data, error } = await drafts().select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as ItemDraft) ?? null;
}

/**
 * Inserts or updates a draft from form state. `scheduledAt` undefined leaves
 * an existing schedule untouched; null clears it.
 */
export async function saveDraft(
  formData: PostFormData,
  draftId?: number | null,
  scheduledAt?: Date | null,
): Promise<number> {
  const row: Record<string, unknown> = { ...buildItemFields(formData) };
  // Drafts may be saved with nothing filled in yet; keep empty strings out of
  // the DB so the "missing fields" check sees them as missing.
  for (const key of ["title", "category", "condition", "description", "location"]) {
    if (typeof row[key] === "string" && (row[key] as string).trim() === "") row[key] = null;
  }
  if (scheduledAt !== undefined) {
    row.scheduled_at = scheduledAt ? scheduledAt.toISOString() : null;
  }

  if (draftId) {
    const { error } = await drafts().update(row).eq("id", draftId);
    if (error) throw error;
    return draftId;
  }
  const { data, error } = await drafts().insert([row]).select("id").single();
  if (error) throw error;
  return (data as { id: number }).id;
}

export async function setDraftSchedule(draftId: number, scheduledAt: Date | null): Promise<void> {
  const { error } = await drafts()
    .update({ scheduled_at: scheduledAt ? scheduledAt.toISOString() : null })
    .eq("id", draftId);
  if (error) throw error;
}

/** Publishes a draft now; returns the new item id. */
export async function publishDraft(draftId: number): Promise<number> {
  const { data, error } = await supabase.rpc("publish_draft" as any, { p_draft_id: draftId });
  if (error) throw error;
  return Number(data);
}

/**
 * Deletes a draft and then its images. Images are only removed from the
 * owner's own folder (images/<uid>/...) -- the storage policy allows nothing
 * else -- and a failed image removal never resurrects the draft.
 */
export async function deleteDraft(draft: Pick<ItemDraft, "id" | "user_id" | "images">): Promise<void> {
  const { error } = await drafts().delete().eq("id", draft.id);
  if (error) throw error;

  const paths = (draft.images ?? [])
    .map((url) => storagePathFromPublicUrl(url))
    .filter((p): p is string => !!p && p.startsWith(`images/${draft.user_id}/`));
  if (paths.length === 0) return;
  const { error: rmError } = await supabase.storage.from("post-images").remove(paths);
  if (rmError) console.warn("[drafts] image cleanup failed", rmError.message);
}

export function storagePathFromPublicUrl(url: string): string | null {
  const marker = "/storage/v1/object/public/post-images/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  try {
    return decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
  } catch {
    return null;
  }
}

/** Shape PostForm / usePostFormState expect as `initialData`. */
export function draftToInitialData(draft: ItemDraft) {
  return {
    draftId: draft.id,
    scheduled_at: draft.scheduled_at,
    item_type: draft.item_type,
    title: draft.title ?? "",
    description: draft.description ?? "",
    category: draft.category ?? "",
    condition: draft.condition ?? "",
    images: draft.images ?? [],
    image_crops: draft.image_crops ?? [],
    location: draft.location ?? "",
    // usePostFormState expects coordinates as { x: lng, y: lat }.
    coordinates: draft.coordinates_json
      ? { x: draft.coordinates_json.lng, y: draft.coordinates_json.lat }
      : null,
    measurements: draft.measurements ?? {},
    visibility_radius_km: draft.visibility_radius_km,
    pickup_preference: draft.pickup_preference ?? "",
    pickup_address: draft.pickup_address ?? "",
    pickup_door_code: draft.pickup_door_code ?? "",
    pickup_floor: draft.pickup_floor,
    pickup_instructions: draft.pickup_instructions ?? "",
    preferred_time_window: draft.preferred_time_window ?? "",
    phone: draft.phone ?? "",
  };
}

/** i18n key for a DB error raised by the drafts trigger/RPC, if recognised. */
export function draftErrorKey(error: unknown): string | null {
  const message = String((error as any)?.message ?? "");
  if (message.includes("draft_incomplete")) return "drafts.error_incomplete";
  if (message.includes("schedule_in_past")) return "drafts.schedule_too_soon";
  if (message.includes("schedule_too_far")) return "drafts.schedule_too_far";
  if (message.includes("draft_not_found")) return "drafts.error_not_found";
  return null;
}

export type DraftField = "title" | "category" | "condition" | "location" | "images";

/** Client mirror of _draft_missing_fields() -- what blocks publish/schedule. */
export function draftMissingFields(draft: ItemDraft): DraftField[] {
  const missing: DraftField[] = [];
  if (!draft.title?.trim()) missing.push("title");
  if (!draft.category) missing.push("category");
  if (!draft.condition) missing.push("condition");
  if (draft.coordinates_json?.lat == null || draft.coordinates_json?.lng == null) missing.push("location");
  if (!draft.images?.length) missing.push("images");
  return missing;
}
