-- "Överlämning: Ses på PIF-adressen." read oddly when the piffer hadn't
-- shared the address (items.pickup_address empty): the receiver was told
-- to meet at an address they'd never been given. Without one, the line now
-- says the piffer sends it in the chat; same for "lämnar vid dörren".
-- Patches the live definition in place; idempotent (a second run finds
-- nothing to replace).
DO $mig$
DECLARE
  v_def text;
  v_new text;
BEGIN
  SELECT pg_get_functiondef('public._insert_pif_system_messages(uuid,bigint,uuid,uuid)'::regprocedure)
    INTO v_def;

  v_new := replace(v_def,
    $o$v_handover_line := 'Överlämning: Ses på PIF-adressen.';$o$,
    $n$v_handover_line := case when v_addr is not null
        then 'Överlämning: Ses på PIF-adressen.'
        else 'Överlämning: Ses på piffarens adress – piffaren skickar den här i chatten.' end;$n$);
  v_new := replace(v_new,
    $o$v_handover_line := 'Överlämning: Piffaren lämnar föremålet vid dörren.';$o$,
    $n$v_handover_line := case when v_addr is not null
        then 'Överlämning: Piffaren lämnar föremålet vid dörren.'
        else 'Överlämning: Piffaren lämnar föremålet vid dörren och skickar adressen här i chatten.' end;$n$);

  IF v_new <> v_def THEN
    EXECUTE v_new;
  END IF;
END
$mig$;
