
-- Create a function to get all interaction counts in a single query
CREATE OR REPLACE FUNCTION public.get_bulk_interaction_counts(item_ids bigint[])
RETURNS TABLE (
  item_id bigint,
  likes_count bigint,
  interests_count bigint,
  comments_count bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT 
    unnest.item_id,
    COALESCE(likes.count, 0) as likes_count,
    COALESCE(interests.count, 0) as interests_count,
    COALESCE(comments.count, 0) as comments_count
  FROM 
    unnest(item_ids) AS unnest(item_id)
  LEFT JOIN (
    SELECT item_id, COUNT(*) as count
    FROM public.likes 
    WHERE item_id = ANY(item_ids)
    GROUP BY item_id
  ) likes ON unnest.item_id = likes.item_id
  LEFT JOIN (
    SELECT item_id, COUNT(*) as count
    FROM public.interests 
    WHERE item_id = ANY(item_ids)
    GROUP BY item_id
  ) interests ON unnest.item_id = interests.item_id
  LEFT JOIN (
    SELECT item_id, COUNT(*) as count
    FROM public.comments 
    WHERE item_id = ANY(item_ids)
    GROUP BY item_id
  ) comments ON unnest.item_id = comments.item_id;
$function$
