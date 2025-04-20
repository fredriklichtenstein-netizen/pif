
import { supabase } from "@/integrations/supabase/client";
import { fetchWithTimeout } from "@/utils/connectionRetryUtils";
import { formatCommentFromDB } from "../utils/commentFormatters";
import { Comment } from "@/types/comment";

export async function runCommentQuery(numericItemId: number, userId?: string, controller?: AbortController): Promise<Comment[]> {
  const signal = controller?.signal;
  console.log(`Running comment query for item ${numericItemId}, user ${userId || 'unknown'}`);
  
  const query = supabase
    .from('comments')
    .select(`
      id,
      content,
      created_at,
      user_id,
      profiles:user_id (
        id,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('item_id', numericItemId)
    .order('created_at', { ascending: true });

  let queryResult: any;
  // Support abortSignal if available
  if (signal && typeof query.abortSignal === "function") {
    queryResult = await query.abortSignal(signal);
  } else {
    queryResult = await query;
  }

  const response = await fetchWithTimeout(
    () => Promise.resolve(queryResult),
    5000
  );

  if (response.error) {
    console.error("Error in comment query:", response.error);
    throw response.error;
  }
  
  const commentsData = response.data;
  if (!commentsData) {
    console.log("No comments data returned from query");
    return [];
  }
  
  console.log(`Received ${commentsData.length} comments for item ${numericItemId}`);
  
  return commentsData.map((comment: any) => {
    const isOwnComment = comment.user_id === userId;
    console.log(`Comment ${comment.id} by user ${comment.user_id} (own: ${isOwnComment})`);
    return formatCommentFromDB(comment, isOwnComment);
  });
}
