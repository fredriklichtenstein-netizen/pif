import { supabase } from "@/integrations/supabase/client";
import { formatCommentFromDB } from "../utils/commentFormatters";
import { Comment } from "@/types/comment";

export async function runCommentQuery(
  numericItemId: number,
  userId?: string,
  _controller?: AbortController
): Promise<Comment[]> {
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

  // Load like counts + the user's own like state for these comments
  const commentIds = data.map((c: any) => c.id);
  let likeCountByComment = new Map<number, number>();
  let likedByMe = new Set<number>();
  if (commentIds.length > 0) {
    try {
      const { data: likes } = await (supabase as any)
        .from('comment_likes')
        .select('comment_id, user_id')
        .in('comment_id', commentIds);
      if (Array.isArray(likes)) {
        for (const l of likes as Array<{ comment_id: number; user_id: string }>) {
          likeCountByComment.set(l.comment_id, (likeCountByComment.get(l.comment_id) ?? 0) + 1);
          if (userId && l.user_id === userId) likedByMe.add(l.comment_id);
        }
      }
    } catch (e) {
      // Table may not yet exist (migration pending) — ignore.
    }
  }

  // Build flat list with likes/isLiked filled in.
  const flat: Array<Comment & { _parentId: number | null; _id: number }> = data.map((c: any) => {
    const base = formatCommentFromDB(c, c.user_id === userId);
    return {
      ...base,
      likes: likeCountByComment.get(c.id) ?? 0,
      isLiked: likedByMe.has(c.id),
      _parentId: c.parent_id ?? null,
      _id: c.id,
    };
  });

  // Nest: top-level (parent_id null) keep replies populated.
  const byId = new Map<number, Comment>();
  flat.forEach((c) => {
    const { _parentId, _id, ...rest } = c;
    byId.set(_id, { ...rest, replies: [] });
  });
  const roots: Comment[] = [];
  flat.forEach((c) => {
    const node = byId.get(c._id)!;
    if (c._parentId && byId.has(c._parentId)) {
      byId.get(c._parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}
