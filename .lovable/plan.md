## Fixes

### 1. DB: `select_wish_helper` — reset `closed_at` on reuse + drop dead overload

Call-site audit: `src/components/post/interactions/interest/InterestSelectionList.tsx:370` is the ONLY caller. It always passes the 3-arg form `(p_item_id, p_helper_id, p_note)` — `p_note` is sent as `null` when no note exists, so PostgREST always resolves to the 3-arg overload. The 2-arg `select_wish_helper(bigint, uuid)` overload is dead.

New manual migration `db/manual_migrations/select_wish_helper_resets_closed_at.sql`:

1. `DROP FUNCTION IF EXISTS public.select_wish_helper(bigint, uuid);` — kill the dead overload so it can't be invoked by future code with the stale, no-reset-on-reuse behaviour.
2. `DROP FUNCTION IF EXISTS public.select_wish_helper(bigint, uuid, text);` then `CREATE OR REPLACE` the 3-arg version, identical to live except:
   - After the `select … into v_conversation_id` lookup, when the row exists, run `UPDATE public.conversations SET closed_at = NULL WHERE id = v_conversation_id AND closed_at IS NOT NULL` capturing into a `v_was_closed boolean` via `GET DIAGNOSTICS` / `FOUND`.
   - If `v_was_closed` AND existing messages count > 0 (i.e. seed-message branch will NOT post anything), insert ONE pair of system messages so the timeline isn't `selected → withdrawn → [silence]`:
     - To helper: `"Önskaren har valt dig på nytt att uppfylla önskan."`
     - To owner: `"Du har valt {helper_name} på nytt att uppfylla önskan."` — `helper_name` from `coalesce(nullif(profiles.first_name, ''), 'den här personen')`.
   - Everything else (item lock, owner check, interests upsert, unique-violation recovery, seed-message guard) stays verbatim.
3. `revoke all on function public.select_wish_helper(bigint, uuid, text) from public;` + `grant execute … to authenticated;` re-asserted.

No frontend call-site changes — signature unchanged.

### 2. Frontend: footer copy branches on actual close reason

`src/components/messaging/ConversationView.tsx` read-only footer — replace the single ternary with:

- `pifStatus === 'archived'` → existing archived copy (pif vs wish).
- `pifStatus === 'completed'` → existing completed copy (pif vs wish).
- Else (only `conversation.closed_at` is set, e.g. fulfiller withdrawn): neutral `"Den här konversationen är avslutad."` for both pif and wish.

### 3. Frontend: dead-UI freeze after "Ångra valet"

Root cause is the Radix `AlertDialog` body `pointer-events: none` leak — closing the dialog AFTER the await while the parent re-renders into a different subtree (`isClosed` flips, footer/input swap) makes Radix miss the inline-style cleanup. The wish branch never navigates, so the deferred-nav workaround never fires.

In `ConversationView.tsx`, rewrite `handleWithdraw` to close first, then await on the next frame:

```ts
const handleWithdraw = (action: "reopen" | "archive") => {
  setWithdrawOpen(false);
  requestAnimationFrame(async () => {
    const res = await completion.withdraw(action);
    if (!res.ok) return;
    if (isRequest) return; // wish: thread stays, UI flips via refetch
    if (onBack) onBack();
    else navigate("/messages");
  });
};
```

Defensive cleanup on the dialog content: `onCloseAutoFocus={(e) => { e.preventDefault(); document.body.style.pointerEvents = ''; }}` on `<AlertDialogContent>` to scrub any leaked inline style if a future race re-introduces it.

### 4. Copy: plural headline

`src/locales/sv/interactions.json:44` → `"choose_helpers": "Välj vilka som uppfyller önskan"`.

## Verification

- Re-select a previously-withdrawn fulfiller: footer no longer reads "Önskan är uppfylld", new "valt dig på nytt" pair appears in the thread.
- Withdraw a fulfiller: footer reads neutral "Den här konversationen är avslutad."; page stays interactive (no refresh); other fulfillers unaffected.
- Selection popup header reads "Välj vilka som uppfyller önskan".
- `\df public.select_wish_helper` shows exactly one overload remaining.
