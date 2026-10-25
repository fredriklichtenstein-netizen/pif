-- Back-filled from production's supabase_migrations.schema_migrations (already applied
-- there as version 20260926194351); recorded here so the repo matches live.
CREATE OR REPLACE FUNCTION public.withdraw_pending_email_change()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  had_pending boolean;
BEGIN
  UPDATE auth.users
  SET email_change = '',
      email_change_token_current = '',
      email_change_token_new = '',
      email_change_confirm_status = 0,
      email_change_sent_at = NULL
  WHERE id = auth.uid()
    AND email_change IS NOT NULL AND email_change != ''
  RETURNING true INTO had_pending;

  RETURN coalesce(had_pending, false);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.withdraw_pending_email_change() TO authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_pending_email_change() TO service_role;
