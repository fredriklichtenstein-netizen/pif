
import { supabase } from "@/integrations/supabase/client";
import { formatCommentFromDB } from "../utils/commentFormatters";
import { Comment } from "@/types/comment";

export async function runCommentQuery(
  numericItemId: number,
  userId?: string,
  _controller?: AbortController
): Promise<Comment[]> {
  // Always use a fresh, unsignal-bound query. Reusing/abort-signaling here
  // races with post-insert refetches and causes AbortError loops that wedge
  // the UI in a loading state.
  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles:user_id(id, first_name, last_name, avatar_url)')
    .eq('item_id', numericItemId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error("Error in comment query:", error);
    throw error;
  }
  if (!data) return [];
  return data.map((c: any) => formatCommentFromDB(c, c.user_id === userId));
}
