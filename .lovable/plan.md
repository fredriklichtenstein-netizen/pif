## Lovable implementation plan for approval

Two pre-flight checks resolved. Frontend-only diffs unchanged in shape from the previous plan.

---

### Check A — Payload.title coverage per notification type (Fix 1)

Every current insert path into `notifications` writes `payload.title`. Confirmed by grepping every DB migration that inserts notifications:

- `receiver_selected` / `helper_selected` fan-out — `notify_item_interest_event` (`missing_signal_fixes.sql`, `wish_aware_helper_selected_notification.sql`, `reselection_aware_notifications.sql`, `restore_reselection_notification.sql`)
- `selection_made` — `interest_status_change_notifications.sql` (both pif + wish branches include `title`)
- pif/wish completed — `interest_status_change_notifications.sql`, `wish_aware_helper_selected_notification.sql`, `reselection_aware_notifications.sql`
- `withdraw_receiver` / `withdraw_pif` fan-out + reopened — `withdraw_signals_consolidation.sql`, `withdraw_receiver_wish_delete_on_self_withdraw.sql`, `wish_aware_reopened_archived_notifications.sql`
- system message mirrors — `interest_status_change_notifications.sql`

`safeTitle` in the renderer also guards against the transform-layer fallback `p.title ?? n.title ?? n.type` accidentally surfacing the raw type as a title. So the type-keyed template branch is only reached for genuinely legacy/pre-payload rows — no current type would fall through incorrectly. Safe to keep the existing template as a pure legacy fallback while switching to payload-first for `displayContent` and `ctaUrl` on `receiver_selected` / `helper_selected`.

No additional in-scope bug uncovered.

---

### Check B — `interests` unique constraint + toggle path (Fix 3)

- The client already assumes a unique `(user_id, item_id)` constraint: `useInterestActions.addInterest` uses `.upsert([payload], { onConflict: 'user_id, item_id', ignoreDuplicates: !note })`. So a plain re-insert wouldn't happen — the existing add path is upsert-based and handles the collision.
- Withdraw path for non-selected users (`removeInterest` → `withdrawPreSelectionInterest`) does a `DELETE` — because `status !== 'selected'`, it takes the plain-delete branch, not `withdraw_receiver`. So the row goes away cleanly before any re-add.
- `showInterest` state is derived from **row existence**, not from `status` (`useInterests.ts` line 122: `setShowInterest(!!userInterest)`). So a `not_selected` row correctly renders the button as "already interested" — clicking it triggers the delete path (not another insert), no unique-collision case to handle.

Concrete flow after Fix 3 for a non-selected user:
1. They have a row with `status = 'not_selected'` → button shows active/interested (currently disabled; fix unlocks it).
2. Click → `removeInterest` → row is not `selected` → `withdrawPreSelectionInterest` deletes the row cleanly.
3. Click again to re-express interest → `addInterest` upserts a fresh row (status defaults to `pending`). Since the row was just deleted, this is a plain insert; the upsert guard would only matter if a stale realtime race left the row behind.

Server-side single-selection guarantee stays intact: `select_receiver` enforces uniqueness of the selected receiver regardless of how many `pending`/`not_selected` interest rows exist alongside.

No client changes needed beyond the button gate itself. No DB changes.

---

### Files to touch (unchanged from prior plan)

- `src/components/notifications/NotificationList.tsx` — payload-first `displayContent` + `ctaUrl` for `receiver_selected` (both pif and wish sub-branches). Keep existing template as legacy fallback.
- `src/locales/sv/interactions.json` — update `withdraw_selection_description` to say the receiver **is** notified automatically that the pif is open again.
- `src/locales/en/interactions.json` — matching EN update.
- `src/components/post/interactions/InteractionButtonWithPopup.tsx` — remove the `else if (hasSelection) { perspectiveDisabled = true; perspectiveDim = true; }` block in the pif branch so non-selected users can freely toggle. Wish branch and `isCurrentSelected` → "Du är vald" behavior untouched.
