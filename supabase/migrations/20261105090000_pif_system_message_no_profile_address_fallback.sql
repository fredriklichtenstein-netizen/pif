-- The post form lets the owner choose whether to share the pickup address
-- with the receiver. Without a shared address on the item, don't fall back to
-- the profile's address. Idempotent: the replaces are no-ops once applied.
DO $mig$
DECLARE d text;
BEGIN
  SELECT pg_get_functiondef('public._insert_pif_system_messages(uuid,bigint,uuid,uuid)'::regprocedure) INTO d;
  d := replace(d,
    E'select pickup_preference, pickup_address\n      into v_profile_pref, v_profile_addr',
    E'select pickup_preference\n      into v_profile_pref');
  d := replace(d,
    E'v_addr := coalesce(nullif(btrim(v_item_addr), \'\'), nullif(btrim(v_profile_addr), \'\'));',
    E'-- Only an address the owner chose to share on this pif; no profile fallback.\n    v_addr := nullif(btrim(v_item_addr), \'\');');
  EXECUTE d;
END
$mig$;
