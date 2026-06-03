-- SECURITY DEFINER RPC to list all participants of conversations the caller
-- is a member of. Needed because RLS on public.conversation_participants
-- restricts direct SELECT to the caller's own rows, hiding the "other"
-- participant in 1:1 conversations. The function validates membership
-- before returning rows.
--
-- Apply manually in the Supabase SQL editor.

CREATE OR REPLACE FUNCTION public.get_conversation_participants(
  p_conversation_ids uuid[]
)
RETURNS TABLE (
  conversation_id uuid,
  user_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cp.conversation_id, cp.user_id
  FROM public.conversation_participants cp
  WHERE cp.conversation_id = ANY (p_conversation_ids)
    AND EXISTS (
      SELECT 1
      FROM public.conversation_participants me
      WHERE me.conversation_id = cp.conversation_id
        AND me.user_id = auth.uid()
    );
$$;

REVOKE ALL ON FUNCTION public.get_conversation_participants(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_conversation_participants(uuid[]) TO authenticated;
