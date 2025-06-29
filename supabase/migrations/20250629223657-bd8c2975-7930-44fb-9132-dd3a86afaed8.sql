
CREATE OR REPLACE FUNCTION public.get_user_average_rating(user_id_param uuid)
 RETURNS numeric
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT COALESCE(AVG(rating), 0)::DECIMAL(3,2)
  FROM public.ratings
  WHERE rated_user_id = user_id_param;
$function$
