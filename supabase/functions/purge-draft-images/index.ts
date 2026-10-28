import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Removes the Storage objects of drafts that _cleanup_stale_drafts() (pg_cron,
// daily) just deleted. Storage objects can't be deleted from SQL
// (storage.objects protect_delete trigger), so the DB hands the image URLs
// over in one batched pg_net call, authenticated with the same
// x-internal-secret as send-notification-email.
//
// Defence in depth -- a path is only removed if it is in the draft owner's
// own folder (post-images/images/<userId>/...) and no item still references
// the URL.

const BUCKET = "post-images";
const PUBLIC_MARKER = `/storage/v1/object/public/${BUCKET}/`;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

function toOwnedPath(url: string, userId: string): string | null {
  const idx = url.indexOf(PUBLIC_MARKER);
  if (idx === -1) return null;
  const path = decodeURIComponent(url.slice(idx + PUBLIC_MARKER.length).split("?")[0]);
  const parts = path.split("/");
  if (parts.length < 3 || parts[0] !== "images" || parts[1] !== userId) return null;
  if (parts.some((p) => p === "" || p === "." || p === "..")) return null;
  return path;
}

serve(async (req) => {
  const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  if (!internalSecret || req.headers.get("x-internal-secret") !== internalSecret) {
    return json(401, { error: "Unauthorized" });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const drafts = Array.isArray(body.drafts) ? body.drafts : [];

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    let removed = 0;
    let skipped = 0;
    for (const draft of drafts) {
      const userId = String(draft?.userId ?? "");
      const urls: string[] = Array.isArray(draft?.images) ? draft.images.map(String) : [];
      if (!userId || urls.length === 0) continue;

      // Never remove an image a live/archived item still points at.
      const { data: inUse, error: inUseErr } = await admin
        .from("items")
        .select("images")
        .eq("user_id", userId)
        .overlaps("images", urls);
      if (inUseErr) {
        console.error("[purge-draft-images] items lookup failed", { userId, error: inUseErr.message });
        skipped += urls.length;
        continue;
      }
      const referenced = new Set<string>((inUse ?? []).flatMap((r: any) => r.images ?? []));

      const paths = urls
        .filter((u) => !referenced.has(u))
        .map((u) => toOwnedPath(u, userId))
        .filter((p): p is string => p !== null);
      skipped += urls.length - paths.length;
      if (paths.length === 0) continue;

      const { error } = await admin.storage.from(BUCKET).remove(paths);
      if (error) {
        console.error("[purge-draft-images] remove failed", { userId, paths, error: error.message });
        skipped += paths.length;
      } else {
        removed += paths.length;
      }
    }

    console.log("[purge-draft-images] done", { drafts: drafts.length, removed, skipped });
    return json(200, { ok: true, removed, skipped });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[purge-draft-images] error", message);
    return json(500, { error: message });
  }
});
