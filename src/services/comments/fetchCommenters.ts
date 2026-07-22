import { supabase } from "@/integrations/supabase/client";
import type { User } from "@/hooks/item/utils/userUtils";
import { resolveDisplayName } from "@/utils/displayName";

/**
 * Fetch the unique users who have commented on a given item.
 * Used by the comments counter popover.
 */
export const fetchCommentersForItem = async (
  itemId: string | number
): Promise<User[]> => {
  const numericId =
    typeof itemId === "number" ? itemId : parseInt(itemId, 10);
  if (isNaN(numericId)) return [];

  const { data: comments, error } = await supabase
    .from("comments")
    .select("user_id")
    .eq("item_id", numericId);

  if (error || !comments || comments.length === 0) return [];

  const userIds = [...new Set(comments.map((c: any) => c.user_id))].filter(
    Boolean
  );
  if (userIds.length === 0) return [];

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url")
    .in("id", userIds);

  if (profilesError || !profiles) return [];

  return profiles.map((p: any) => ({
    id: p.id,
    name: resolveDisplayName(p, "User"),
    avatar: p.avatar_url || undefined,
  }));
};
