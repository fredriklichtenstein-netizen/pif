# Withdraw Signals Consolidation — `withdraw_pif` closed_reason fix

## Confirmation on the shared pif-branch value

**Yes, intentional — keep `'fulfiller_withdrew'` shared across rows 1-3's pif branch.** All three call sites are the same actor (the piffer) performing the same conceptual action (unselecting the chosen receiver) on the same item type (pif). The UI entry point differs but the domain event does not, and `closed_reason` is a domain-level label, not a UI-trace label. Splitting it three ways would create labels that no downstream consumer cares about. The actor distinction (owner-initiated vs. self-withdrawal) is the only one that matters, and that's now correctly encoded by `'fulfiller_withdrew'` (owner) vs. `'receiver_self_withdrew'` (self).

## closed_reason matrix after fix

| Function | Branch | Actor | `closed_reason` |
|---|---|---|---|
| `withdraw_pif` | pif | owner (piffer) | `'fulfiller_withdrew'` *(unchanged, shared across rows 1-3)* |
| `withdraw_pif` | wish | owner (wisher) | **`'owner_withdrew_fulfiller'`** ← fixed |
| `withdraw_receiver` | pif | self (receiver) | `'receiver_self_withdrew'` |
| `withdraw_receiver` | wish | self (fulfiller) | `'fulfiller_self_withdrew'` |

Four distinct values, one per (item_type × actor) cell. No collisions.

## Corrected `withdraw_pif`

```sql
DROP FUNCTION IF EXISTS public.withdraw_pif(bigint, text, uuid);

CREATE OR REPLACE FUNCTION public.withdraw_pif(
  p_item_id bigint, p_action text, p_fulfiller_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid; v_item_type text; v_title text;
  v_conversation uuid; v_dropped uuid;
  v_msg_to_fulfiller text;
BEGIN
  IF p_action NOT IN ('reopen', 'archive') THEN
    RAISE EXCEPTION 'Invalid action: %', p_action USING ERRCODE = '22023';
  END IF;

  SELECT user_id, item_type, title INTO v_owner, v_item_type, v_title
    FROM public.items WHERE id = p_item_id FOR UPDATE;

  IF v_owner IS NULL THEN RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002'; END IF;
  IF v_owner <> auth.uid() THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;

  -- ===== WISH branch (owner-initiated unselect of a fulfiller) =====
  IF v_item_type = 'request' THEN
    IF p_fulfiller_id IS NULL THEN
      RAISE EXCEPTION 'p_fulfiller_id is required when withdrawing on a wish'
        USING ERRCODE = '22023';
    END IF;

    DELETE FROM public.interests
      WHERE item_id = p_item_id AND status = 'selected' AND user_id = p_fulfiller_id;

    SELECT c.id INTO v_conversation
      FROM public.conversations c
      JOIN public.conversation_participants cp ON cp.conversation_id = c.id
      WHERE c.item_id = p_item_id AND cp.user_id = p_fulfiller_id
        AND c.closed_at IS NULL
      LIMIT 1;

    IF v_conversation IS NOT NULL THEN
      INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
        VALUES (v_conversation, v_owner,
          'Önskaren har avmarkerat ditt erbjudande. Önskan är fortfarande aktiv för andra som vill hjälpa.',
          true, p_fulfiller_id);
      INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
        VALUES (v_conversation, v_owner,
          'Du har avmarkerat hjälparen. Önskan förblir aktiv.', true, v_owner);

      UPDATE public.conversations
        SET closed_at = now(), closed_reason = 'owner_withdrew_fulfiller'  -- FIXED: distinct from withdraw_receiver's 'fulfiller_self_withdrew'
        WHERE id = v_conversation AND closed_at IS NULL;
    END IF;

    -- Notification fires whether or not a conversation existed (signal-required path).
    PERFORM public.notify_item_interest_event(
      p_item_id, 'wish_offer_withdrew', p_fulfiller_id, false
    );
    RETURN;
  END IF;

  -- ===== PIF branch (owner-initiated unselect of the receiver) =====
  SELECT user_id INTO v_dropped
    FROM public.interests
    WHERE item_id = p_item_id AND status = 'selected'
    LIMIT 1;

  DELETE FROM public.interests WHERE item_id = p_item_id AND status = 'selected';
  UPDATE public.interests SET status = 'pending', selected_at = NULL
    WHERE item_id = p_item_id AND status = 'not_selected';

  IF p_action = 'reopen' THEN
    UPDATE public.items SET pif_status = 'active',
      piffer_confirmed_handoff = false, receiver_confirmed_receipt = false,
      archived_at = NULL, archived_reason = NULL
      WHERE id = p_item_id;
  ELSE
    UPDATE public.items SET pif_status = 'archived',
      piffer_confirmed_handoff = false, receiver_confirmed_receipt = false,
      archived_at = now(), archived_reason = 'Piffer withdrew'
      WHERE id = p_item_id;
  END IF;

  IF v_dropped IS NOT NULL THEN
    SELECT c.id INTO v_conversation
      FROM public.conversations c
      JOIN public.conversation_participants cp ON cp.conversation_id = c.id
      WHERE c.item_id = p_item_id AND cp.user_id = v_dropped
        AND c.closed_at IS NULL
      LIMIT 1;

    IF v_conversation IS NOT NULL THEN
      v_msg_to_fulfiller := CASE WHEN p_action = 'reopen'
        THEN 'Piffaren har avmarkerat dig som mottagare. Piffen är öppen igen för andra.'
        ELSE 'Piffaren har avmarkerat dig som mottagare och avslutat piffen.' END;

      INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
        VALUES (v_conversation, v_owner, v_msg_to_fulfiller, true, v_dropped);
      INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
        VALUES (v_conversation, v_owner,
          'Du har avmarkerat mottagaren. Mottagaren har informerats.', true, v_owner);
    END IF;
  END IF;

  UPDATE public.conversations
    SET closed_at = now(), closed_reason = 'fulfiller_withdrew'  -- unchanged; shared across rows 1-3 by design (owner-initiated, pif branch)
    WHERE item_id = p_item_id AND closed_at IS NULL;

  IF v_dropped IS NOT NULL THEN
    PERFORM public.notify_item_interest_event(
      p_item_id, 'interest_withdrawn', v_dropped, false
    );
  END IF;

  PERFORM public.notify_item_interest_event(
    p_item_id, CASE WHEN p_action = 'reopen' THEN 'pif_reopened' ELSE 'pif_archived' END,
    v_dropped, false
  );
END;
$function$;
```

Only `withdraw_pif` is resent; `withdraw_receiver` and `notify_item_interest_event` from the previous plan are unchanged and stand approved.
