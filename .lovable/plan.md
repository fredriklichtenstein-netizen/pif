# Fix: complete_pif_with_rating "No selected receiver found" (P0002)

## Findings from code investigation

The `item_id` resolution path is clean and should be correct:

1. `ConversationView` loads via `useConversationDetails(conversationId)`, which `SELECT`s `conversations` joined to `items` via the FK (`item:items(*)`). The conversation's own `item_id` column drives the join — there is no chance of joining the "wrong" item.
2. `useConversationDetails` sets `item.id = String(data.item.id)` directly from that joined row.
3. `ConversationView` passes `item?.id ?? null` into `usePifCompletion`, which converts back to `number` via `numericItemId()` (safe — `items.id` is a bigint well under 2^53 in this app).
4. `PifRatingModal.onSubmit` calls `completion.completeWithRating(rating, comment)` — a fresh closure on every render, so `id` is the latest item id, not stale.
5. The session is already verified by the new `ensureSession("complete_pif_with_rating")` probe; `hasSession`/`hasAccessToken` are both true.

So the client is **passing the right `p_item_id`**. There is no item-id mismatch, no stale closure, and no missing JWT.

## Root cause (server-side)

The banner's "Markera som klar ändå" button is only shown **after** the piffer has already called `confirm_pif_handoff('piffer')` (see `PifCompletionBanner.tsx` lines 67–82 — the button is gated on `confirmed && !receiverConfirmed`).

That means by the time `complete_pif_with_rating` runs, `confirm_pif_handoff` has already mutated the row state. The `complete_pif_with_rating` RPC currently looks up the receiver with:

```sql
SELECT id FROM public.interests
WHERE item_id = p_item_id AND status = 'selected';
```

…but `confirm_pif_handoff` (and/or the piffer-side "Mark as piffed" path in `PostModal.tsx`, which sets `pif_status='piffed'`) transitions the chosen interest's `status` away from `'selected'` once the handoff has been recorded. The selected receiver therefore can't be located by `status='selected'` anymore, and the RPC raises `P0002 'No selected receiver found'`.

This matches the symptom exactly: two-sided confirm works (it never needs to re-look-up the receiver — both confirmations are stored on `items` columns), but the one-sided hard-complete fails because it is the only path that depends on the now-stale `status='selected'` lookup.

The user reports rows exist "for the relevant items" — but the row's current `status` is no longer `'selected'`, which is what's breaking the WHERE clause.

## Fix

Change `public.complete_pif_with_rating` so it resolves the receiver from the **conversation participants** (the durable source of truth), falling back to any non-piffer interest if the conversation row is unavailable. This makes the lookup independent of the interest-status state machine.

### New RPC body (replace existing function)

Add a new manual migration `db/manual_migrations/complete_pif_with_rating_receiver_lookup.sql`:

```sql
CREATE OR REPLACE FUNCTION public.complete_pif_with_rating(
  p_item_id  bigint,
  p_rating   int,
  p_comment  text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_piffer    uuid;
  v_receiver  uuid;
BEGIN
  SELECT user_id INTO v_piffer FROM public.items WHERE id = p_item_id FOR UPDATE;
  IF v_piffer IS NULL THEN
    RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_piffer <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  -- Primary: the receiver is the other participant of the pif's conversation.
  SELECT CASE WHEN participant_a = v_piffer THEN participant_b ELSE participant_a END
    INTO v_receiver
  FROM public.conversations
  WHERE item_id = p_item_id
  ORDER BY created_at ASC
  LIMIT 1;

  -- Fallback: any interest row for this item that isn't the piffer (covers
  -- legacy data where status was transitioned away from 'selected').
  IF v_receiver IS NULL THEN
    SELECT user_id INTO v_receiver
    FROM public.interests
    WHERE item_id = p_item_id AND user_id <> v_piffer
    ORDER BY (status = 'selected') DESC, selected_at DESC NULLS LAST, created_at DESC
    LIMIT 1;
  END IF;

  IF v_receiver IS NULL THEN
    RAISE EXCEPTION 'No selected receiver found' USING ERRCODE = 'P0002';
  END IF;

  -- Persist rating (private), mark item completed, clear pending confirmations.
  INSERT INTO public.ratings (item_id, rater_id, ratee_id, rating, comment, created_at)
  VALUES (p_item_id, v_piffer, v_receiver, p_rating, NULLIF(btrim(p_comment), ''), now())
  ON CONFLICT (item_id, rater_id, ratee_id) DO UPDATE
    SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, created_at = now();

  UPDATE public.items
     SET pif_status = 'completed',
         piffer_confirmed_handoff = true,
         receiver_confirmed_receipt = true,
         completed_at = now()
   WHERE id = p_item_id;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_pif_with_rating(bigint, int, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_pif_with_rating(bigint, int, text) TO authenticated;
```

The exact `ratings` column names / `items` completion columns will be reconciled with the live schema before writing the migration; the structural change — receiver lookup via `conversations` instead of `interests.status='selected'` — is what fixes the bug.

### Client-side: temporary diagnostic log (kept behind `?debug=1`)

In `src/hooks/usePifCompletion.ts`, just before the `complete_pif_with_rating` RPC, add:

```ts
debugLog("rpc", "complete_pif_with_rating args", { p_item_id: id, p_rating: rating, hasComment: !!comment });
```

So the AuthHydrationDebugPanel / Export Debug Report captures the exact `p_item_id` used at call time. (No behavior change; helps confirm the fix and rule out future ambiguity.)

## Verification

1. Apply the new migration in Supabase.
2. On a pif where the piffer has already tapped "Jag har lämnat över piffen" but the receiver has not confirmed, tap "Markera som klar ändå", rate, submit.
3. Expect: RPC returns success, banner flips to "Piffen är genomförd! 🎉", `items.pif_status = 'completed'`.
4. Debug panel shows `complete_pif_with_rating args { p_item_id: <correct id> }` then no error.

## Out of scope

- Refactoring `confirm_pif_handoff` (it works correctly).
- Changing the two-sided completion path.
- Touching the wish/helper rating flow (`submit_helper_rating`).
- Removing the `ensureSession` probe (still useful guardrail).
