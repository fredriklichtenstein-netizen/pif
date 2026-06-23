-- Apply manually on your Supabase project.
--
-- Cleanup pass after consolidating notification writes on the 3-arg
-- public.create_notification(p_user_id, p_type, p_payload) RPC.
--
-- Path A duplicates: legacy selection triggers fired alongside the
-- client-side notify_item_interest_event RPC, producing two rows per
-- selection. The RPC is the only path we keep.
DROP TRIGGER IF EXISTS trg_notify_receiver_selected ON public.interests;
DROP TRIGGER IF EXISTS trg_notify_helper_selected  ON public.interests;
DROP FUNCTION IF EXISTS public.notify_receiver_selected();
DROP FUNCTION IF EXISTS public.notify_helper_selected();

-- Orphaned 5-arg create_notification overload + the five trigger
-- functions that reference it. Confirmed via pg_trigger to have zero
-- live attachments; they reference a posts/author_id schema that no
-- longer exists in this project.
DROP FUNCTION IF EXISTS public.trg_notify_comment();
DROP FUNCTION IF EXISTS public.trg_notify_comment_like();
DROP FUNCTION IF EXISTS public.trg_notify_follow();
DROP FUNCTION IF EXISTS public.trg_notify_post_like();
DROP FUNCTION IF EXISTS public.trg_notify_chain_link();
DROP FUNCTION IF EXISTS public.create_notification(uuid, uuid, text, uuid, uuid);
